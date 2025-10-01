// src/pages/CustomerPanel.jsx
import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

export default function CustomerPanel() {
  const { user } = useAuth();
  const [tab, setTab] = React.useState("profile");

  // ---- PROFIL ----
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.id) { setProfile(null); return; }
      setProfileLoading(true);

      // .maybeSingle() => brak rekordu zwraca 200 + null (bez 406)
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name,last_name,city,address,phone,role,email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;
      if (error) console.warn("profile load error:", error);
      setProfile(data ?? null);
      setProfileLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [user?.id]);

  return (
    <div className="mx-auto mt-24 max-w-5xl px-4 pb-20">
      <h1 className="mb-1 text-center text-3xl font-extrabold text-white">
        Panel Klienta
      </h1>
      <p className="mb-6 text-center text-slate-300">
        Zarządzaj swoim kontem, zamówieniami i ustawieniami
      </p>

      <div className="mb-4 flex gap-2">
        <TabBtn current={tab} setTab={setTab} id="profile">Profil</TabBtn>
        <TabBtn current={tab} setTab={setTab} id="orders">Zamówienia</TabBtn>
        <TabBtn current={tab} setTab={setTab} id="settings">Ustawienia</TabBtn>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        {tab === "profile" && (
          <section className="grid gap-4 md:grid-cols-2">
            {profileLoading && (
              <div className="md:col-span-2 text-slate-300">Ładowanie profilu…</div>
            )}
            {!profileLoading && (
              <>
                <Field
                  label="Imię i nazwisko"
                  value={
                    (profile?.first_name || "") + (profile?.last_name ? ` ${profile.last_name}` : "")
                    || "Nie podano"
                  }
                />
                <Field label="Rola" value={profile?.role || "customer"} />
                <Field label="Email" value={profile?.email || user?.email || "Nie podano"} full />
                <Field label="Telefon" value={profile?.phone || "Nie podano"} />
                <Field label="Adres" value={profile?.address || "Nie podano"} />
                <Field label="Miasto" value={profile?.city || "Nie podano"} />
                <Stats />
              </>
            )}
          </section>
        )}

        {tab === "orders" && <OrdersList userId={user?.id} />}

        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function TabBtn({ current, setTab, id, children }) {
  const active = current === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={[
        "rounded-xl px-4 py-2 text-sm",
        active
          ? "bg-orange-500 text-slate-900"
          : "bg-white/5 text-slate-200 ring-1 ring-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 rounded-xl bg-slate-800/70 px-3 py-2 text-slate-100 ring-1 ring-white/10">
        {value}
      </div>
    </div>
  );
}

function Stats() {
  return (
    <div className="md:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard label="Wszystkich zamówień" value="—" className="from-orange-500/25 to-orange-500/10" />
      <StatCard label="Ukończonych" value="—" className="from-emerald-500/25 to-emerald-500/10" />
      <StatCard label="Łączna kwota" value="—" className="from-purple-500/25 to-purple-500/10" />
    </div>
  );
}

function StatCard({ label, value, className }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${className} p-4 text-white ring-1 ring-white/10`}>
      <div className="text-sm text-white/80">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function OrdersList({ userId }) {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!userId) { setOrders([]); return; }

    let alive = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer", userId)
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (error) console.warn("orders load error:", error);
      setOrders(error ? [] : (data || []));
      setLoading(false);
    };

    load();

    // realtime refresh
    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer=eq.${userId}` },
        load
      )
      .subscribe();

    return () => { alive = false; channel.unsubscribe(); };
  }, [userId]);

  return (
    <div className="space-y-3">
      {loading && <div className="text-slate-300">Ładowanie…</div>}
      {!loading && orders.length === 0 && <div className="text-slate-300">Brak zamówień.</div>}
      {!loading && orders.map((o) => (
        <div key={o.id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">
              {o.restaurant || "Zamówienie"}
            </div>
            <div className="text-slate-300 text-sm">
              {o.status} • {Number(o.total ?? 0).toFixed(2)} zł
            </div>
          </div>
          <button
            className="px-3 py-1 rounded-md border border-red-600 text-red-300 hover:bg-red-600/10"
            onClick={async () => {
              await supabase.from("orders").update({ status: "cancelled" }).eq("id", o.id);
            }}
          >
            Anuluj
          </button>
        </div>
      ))}
    </div>
  );
}

function Settings() {
  return <div className="text-slate-300">Powiadomienia push i preferencje — wkrótce.</div>;
}
