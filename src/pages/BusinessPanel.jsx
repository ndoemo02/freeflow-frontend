// src/pages/BusinessPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supa";

/**
 * Panel biznesowy:
 * - ładuje listę restauracji należących do zalogowanego użytkownika (lub jego biznesu)
 * - pokazuje zamówienia z tych restauracji
 * - nasłuchuje realtime zmian w zamówieniach
 * - pozwala zmieniać status (accept -> completed + paid)
 *
 * Zakładam, że RLS pozwala czytać/aktualizować zamówienia właścicielowi.
 */
export default function BusinessPanel({ userId }) {
  const [restaurants, setRestaurants] = useState([]);   // [{id, name}]
  const [orders, setOrders] = useState([]);             // zamówienia
  const [loading, setLoading] = useState(true);

  // szybki lookup nazwy restauracji
  const rName = useMemo(() => {
    const map = new Map();
    restaurants.forEach((r) => map.set(r.id, r.name ?? r.id));
    return (id) => map.get(id) || id;
  }, [restaurants]);

  // 1) wczytaj restauracje użytkownika
  useEffect(() => {
    const loadRestaurants = async () => {
      // Jeśli masz RLS, najprościej pobrać tylko swoje restauracje, bez podawania userId.
      const { data, error } = await supabase
        .from("restaurants")
        .select("id,name")
        .order("name", { ascending: true });

      if (error) {
        console.error("restaurants error", error);
        setRestaurants([]);
      } else {
        setRestaurants(data ?? []);
      }
    };
    loadRestaurants();
  }, []);

  // 2) wczytaj zamówienia dla tych restauracji
  useEffect(() => {
    const loadOrders = async () => {
      if (!restaurants.length) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // pobieramy wszystkie zamówienia swoich restauracji (RLS powinien przepuścić tylko dozwolone)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("restaurant", restaurants.map((r) => r.id))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("orders error", error);
        setOrders([]);
      } else {
        setOrders(data ?? []);
      }
      setLoading(false);
    };

    loadOrders();
  }, [restaurants]);

  // 3) realtime – subskrypcje per restauracja (Realtime wspiera eq, więc robimy kanał na każdy id)
  useEffect(() => {
    if (!restaurants.length) return;

    const subs = restaurants.map((r) =>
      supabase
        .channel(`orders-${r.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `restaurant=eq.${r.id}` },
          (payload) => {
            setOrders((curr) => {
              const next = [...curr];
              const idx = next.findIndex((o) => o.id === payload.new?.id || o.id === payload.old?.id);

              if (payload.eventType === "INSERT") {
                // dodaj na początek listy
                return [payload.new, ...next];
              }
              if (payload.eventType === "UPDATE") {
                if (idx !== -1) {
                  next[idx] = payload.new;
                  return next;
                }
                // jeżeli nie znaleziono, dodać (np. jeśli filtr był szeroki)
                return [payload.new, ...next];
              }
              if (payload.eventType === "DELETE") {
                if (idx !== -1) {
                  next.splice(idx, 1);
                  return next;
                }
              }
              return curr;
            });
          }
        )
        .subscribe()
    );

    return () => subs.forEach((c) => supabase.removeChannel(c));
  }, [restaurants]);

  // 4) akcje – zmiana statusu
  const acceptOrder = async (orderId) => {
    // optimistic UI
    setOrders((list) =>
      list.map((o) => (o.id === orderId ? { ...o, status: "accepted" } : o))
    );
    const { error } = await supabase
      .from("orders")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      console.error(error);
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? { ...o, status: "placed" } : o))
      );
      alert("Nie udało się zmienić statusu na accepted (sprawdź RLS).");
    }
  };

  const completeAndMarkPaid = async (orderId) => {
    setOrders((list) =>
      list.map((o) =>
        o.id === orderId ? { ...o, status: "completed", payment_status: "paid" } : o
      )
    );
    const { error } = await supabase
      .from("orders")
      .update({
        status: "completed",
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (error) {
      console.error(error);
      // rollback
      setOrders((list) =>
        list.map((o) =>
          o.id === orderId ? { ...o, status: "accepted", payment_status: "pending" } : o
        )
      );
      alert("Nie udało się zamknąć i opłacić zamówienia (sprawdź RLS).");
    }
  };

  const cancelOrder = async (orderId) => {
    setOrders((list) =>
      list.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
    );
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      console.error(error);
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? { ...o, status: "placed" } : o))
      );
      alert("Nie udało się anulować zamówienia (sprawdź RLS).");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h2>Panel biznesu</h2>

      <section>
        <h3>Twoje restauracje</h3>
        {restaurants.length === 0 ? (
          <p>Brak restauracji albo brak uprawnień do podglądu.</p>
        ) : (
          <ul>
            {restaurants.map((r) => (
              <li key={r.id}>
                <strong>{r.name || "(bez nazwy)"}</strong> <code>{r.id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Otrzymane zamówienia</h3>
        {loading ? (
          <p>Ładowanie…</p>
        ) : orders.length === 0 ? (
          <p>Brak zamówień.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {orders.map((o) => (
              <li
                key={o.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div>
                      <strong>{rName(o.restaurant)}</strong>{" "}
                      <small style={{ opacity: 0.7 }}>{o.restaurant}</small>
                    </div>
                    <div>Status: <strong>{o.status}</strong></div>
                    <div>Płatność: <strong>{o.payment_status}</strong> ({o.payment_method})</div>
                    {o.delivery_address && <div>Adres: {o.delivery_address}</div>}
                    {o.customer_notes && <div>Pozycje: {o.customer_notes}</div>}
                    <div>Kwota: {Number(o.total).toFixed(2)} zł</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 190 }}>
                    {o.status === "placed" && (
                      <button onClick={() => acceptOrder(o.id)}>Akceptuj</button>
                    )}
                    {o.status === "accepted" && (
                      <button onClick={() => completeAndMarkPaid(o.id)}>
                        Zakończ & oznacz jako opłacone
                      </button>
                    )}
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <button onClick={() => cancelOrder(o.id)}>Anuluj</button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
