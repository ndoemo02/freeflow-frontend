// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { supabase } from "./supa";
import CustomerPanel from "./pages/CustomerPanel.jsx";
import BusinessPanel from "./pages/BusinessPanel.jsx";

const HERO_DROPLET_STYLE = {
  borderRadius: "58% 58% 46% 46% / 76% 76% 24% 24%",
  background: "linear-gradient(180deg, rgba(255,147,77,0.95) 0%, rgba(255,106,61,0.95) 45%, rgba(161,28,242,0.95) 100%)",
};

const DROPLET_BUTTON_STYLE = {
  borderRadius: "55% 55% 50% 50% / 70% 70% 30% 30%",
};

const BACKGROUND_ACCENTS_STYLE = {
  background:
    "radial-gradient(circle at 20% 20%, rgba(255,147,77,0.45), transparent 55%), radial-gradient(circle at 80% 15%, rgba(161,28,242,0.35), transparent 60%)",
};

function StatusDot({ color = "rgba(255,146,77,1)", glow = "rgba(255,146,77,0.28)", className = "" }) {
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 rounded-full ${className}`}
      style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${glow}` }}
    />
  );
}

function MicrophoneIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FoodIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 12h16v1a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12v-1a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TaxiIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 11h16l-1 6h-1a2 2 0 1 1-4 0h-4a2 2 0 1 1-4 0H5l-1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 7h6l1 4H8l1-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HotelIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 19V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 19h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 19v-4h6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9h.01M12 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M5 6h2l1.2 9h9.6l1.4-7H7.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.6" fill="currentColor" />
      <circle cx="17" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

function SupportIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.75v1.5M12 18.75v1.5M4.75 12h-1.5M20.75 12h-1.5M5.98 5.98l1.06 1.06M16.96 16.96l1.06 1.06M5.98 18.02l1.06-1.06M16.96 7.04l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProtectedRoute({ when, redirect = "/", children }) {
  if (!when) return <Navigate to={redirect} replace />;
  return children;
}

function Navbar({ profile, onSignOut, hasSession }) {
  const isBiz = profile?.user_type === "business";
  const emailLabel = hasSession ? profile?.email ?? "Zalogowany" : "Niezalogowany";

  return (
    <header className="relative z-30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 text-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-purple-500 shadow-[0_0_30px_rgba(255,138,48,0.55)]">
            <MicrophoneIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-orange-200/70">Voice to Order</p>
            <p className="text-2xl font-semibold">
              Free<span className="text-orange-400">Flow</span>
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur md:flex">
            <StatusDot />
            <span>{emailLabel}</span>
          </div>

          <Link to="/customer" className="hidden text-sm font-medium text-orange-200 transition hover:text-white md:block">
            Panel klienta
          </Link>

          {isBiz && (
            <Link to="/business" className="hidden text-sm font-medium text-orange-200 transition hover:text-white md:block">
              Panel biznesowy
            </Link>
          )}

          {hasSession ? (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,106,61,0.45)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
            >
              Wyloguj
            </button>
          ) : (
            <Link
              to="/customer"
              className="rounded-full border border-orange-400/60 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:border-white hover:text-white"
            >
              Zaloguj
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Home({ session, profile }) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const userLabel = profile?.email ?? "Gościu";

  const categories = useMemo(
    () => [
      {
        id: "food",
        label: "Jedzenie",
        description: "Ulubione restauracje i szybkie zamówienia",
        to: "/customer",
        icon: <FoodIcon className="h-6 w-6" />,
        colors: ["rgba(255,147,77,0.85)", "rgba(255,106,61,0.8)"],
      },
      {
        id: "taxi",
        label: "Taxi",
        description: "Zamów przejazd w kilka sekund",
        to: "/customer",
        icon: <TaxiIcon className="h-6 w-6" />,
        colors: ["rgba(255,200,87,0.8)", "rgba(255,147,77,0.75)"],
      },
      {
        id: "hotel",
        label: "Hotel",
        description: "Rezerwacje hoteli i apartamentów",
        to: "/customer",
        icon: <HotelIcon className="h-6 w-6" />,
        colors: ["rgba(161,28,242,0.7)", "rgba(88,24,196,0.7)"],
      },
    ],
    []
  );

  const voiceSuggestions = useMemo(
    () => [
      "dwie pizze w Krakowie",
      "Taxi na Dworzec Główny",
      "Hotel z basenem w Sopocie",
      "Wege burgery w Warszawie",
    ],
    []
  );

  const floatingDrops = useMemo(
    () => [
      {
        id: "map",
        label: "Mapa lokali",
        icon: <MapPinIcon className="h-5 w-5" />,
        gradient: "linear-gradient(180deg, rgba(255,147,77,0.95) 0%, rgba(161,28,242,0.9) 100%)",
      },
      {
        id: "cart",
        label: "Koszyk",
        icon: <CartIcon className="h-5 w-5" />,
        gradient: "linear-gradient(180deg, rgba(255,200,87,0.95) 0%, rgba(255,147,77,0.9) 100%)",
      },
    ],
    []
  );

  const supportOptions = useMemo(
    () => [
      {
        id: "faq",
        title: "FAQ / Pomoc",
        subtitle: "Najczęstsze pytania i instrukcje",
        icon: <SupportIcon className="h-5 w-5" />,
      },
      {
        id: "settings",
        title: "Ustawienia aplikacji",
        subtitle: "Personalizuj język i walutę",
        icon: <SettingsIcon className="h-5 w-5" />,
      },
      {
        id: "orders",
        title: "Twoje zamówienia",
        subtitle: session ? "Sprawdź bieżące realizacje" : "Zaloguj się, by zobaczyć historię",
        icon: <CartIcon className="h-5 w-5" />,
      },
    ],
    [session]
  );

  return (
    <div className="relative overflow-hidden pb-32 pt-12 text-white">
      <div className="absolute inset-0 -z-10">
        <img src="/images/Background.png" alt="Tło FreeFlow" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" />
        <div className="absolute inset-0" style={BACKGROUND_ACCENTS_STYLE} />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-12rem)] max-w-6xl flex-col-reverse gap-12 px-4 md:flex-row md:items-center">
        <section className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/75">
            <StatusDot />
            <span>Tryb głosowy</span>
          </div>

          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Voice to order <span className="text-orange-400">FreeFlow</span>
          </h1>

          <p className="max-w-xl text-base text-white/75 sm:text-lg">
            Powiedz, czego potrzebujesz – my zajmiemy się zamówieniem. Restauracje, taxi i hotele w jednym, płynnym interfejsie.
          </p>

          <div className="rounded-3xl border border-white/15 bg-black/50 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-orange-200/90">
              Wyszukiwanie po lokalizacji
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-full bg-white/10 px-4 py-3">
                <MapPinIcon className="h-5 w-5 text-orange-200" />
                <input
                  type="text"
                  placeholder="Wpisz miasto lub lokal"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff924d] via-[#ff6a3d] to-[#a11cf2] px-6 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(255,106,61,0.45)] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
              >
                <MicrophoneIcon className="h-5 w-5" />
                <span>Powiedz, czego potrzebujesz</span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {voiceSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-orange-300/60 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.to}
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 transition-transform hover:-translate-y-1 hover:border-orange-300/70"
              >
                <div
                  className="absolute inset-0 opacity-80"
                  style={{ background: `linear-gradient(135deg, ${category.colors[0]}, ${category.colors[1]})`, mixBlendMode: "screen" }}
                  aria-hidden="true"
                />
                <div className="relative flex flex-col gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white">
                    {category.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
                      {category.label}
                    </p>
                    <p className="mt-1 text-xs text-white/75">{category.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
              <StatusDot color="rgba(16,185,129,1)" glow="rgba(16,185,129,0.25)" />
              {session ? `Zalogowany jako ${profile?.email ?? "klient FreeFlow"}` : "Zaloguj się, by zapisać historię zamówień"}
            </div>
            <Link to="/customer" className="inline-flex items-center gap-2 text-orange-200 transition hover:text-white">
              <ArrowRightIcon className="h-4 w-4" />
              <span>{session ? "Przejdź do panelu klienta" : "Otwórz panel klienta"}</span>
            </Link>
          </div>
        </section>

        <aside className="flex flex-1 justify-center md:justify-end">
          <div className="relative flex h-[26rem] w-[15rem] items-center justify-center sm:w-[18rem] md:w-[20rem]">
            <div className="absolute inset-0 rounded-full bg-[#ff8a30]/30 blur-3xl" aria-hidden="true" />
            <div
              className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-10 text-center shadow-[0_40px_80px_rgba(255,106,61,0.45)]"
              style={HERO_DROPLET_STYLE}
            >
              <img
                src="/images/Freeflowlogo.png"
                alt="FreeFlow logo"
                className="w-40 drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
              />
              <p className="mt-5 text-[0.65rem] uppercase tracking-[0.4em] text-white/80">Złóż zamówienie głosem</p>
              <div className="mt-6 grid w-full grid-cols-3 gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/85">
                <span className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 px-2 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30">
                    <FoodIcon className="h-5 w-5" />
                  </span>
                  Jedzenie
                </span>
                <span className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 px-2 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30">
                    <TaxiIcon className="h-5 w-5" />
                  </span>
                  Taxi
                </span>
                <span className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 px-2 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30">
                    <HotelIcon className="h-5 w-5" />
                  </span>
                  Hotel
                </span>
              </div>
            </div>
            <div className="absolute inset-x-10 -bottom-10 h-16 rounded-full bg-black/40 blur-2xl" aria-hidden="true" />
          </div>
        </aside>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/60 to-transparent" aria-hidden="true" />

      <div className="fixed bottom-44 right-5 hidden flex-col gap-4 lg:flex">
        {floatingDrops.map((action) => (
          <button
            key={action.id}
            type="button"
            className="group relative flex h-16 w-14 items-center justify-center text-white transition-transform hover:-translate-y-1"
            style={{ ...DROPLET_BUTTON_STYLE, background: action.gradient, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
          >
            <span className="sr-only">{action.label}</span>
            {action.icon}
            <span className="pointer-events-none absolute right-full mr-3 rounded-full bg-black/70 px-3 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsSupportOpen((prev) => !prev)}
        className="fixed bottom-16 right-5 z-40 flex h-20 w-16 items-center justify-center text-white transition-transform hover:-translate-y-1"
        style={{
          ...DROPLET_BUTTON_STYLE,
          background: isSupportOpen
            ? "linear-gradient(180deg, rgba(161,28,242,0.95) 0%, rgba(88,24,196,0.95) 100%)"
            : "linear-gradient(180deg, rgba(255,147,77,0.95) 0%, rgba(255,106,61,0.95) 100%)",
          boxShadow: isSupportOpen
            ? "0 25px 55px rgba(88,24,196,0.55)"
            : "0 25px 55px rgba(255,106,61,0.45)",
        }}
      >
        <SupportIcon className="h-6 w-6" />
        <span className="sr-only">{isSupportOpen ? "Zamknij panel wsparcia" : "Otwórz panel wsparcia"}</span>
      </button>

      <div
        className={`fixed right-5 top-28 z-30 w-72 max-w-[85vw] transition-all duration-300 ${
          isSupportOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-24 opacity-0"
        }`}
      >
        <div
          className="rounded-3xl border border-white/15 bg-black/80 p-6 text-sm text-white/80 shadow-[0_30px_70px_rgba(0,0,0,0.6)]"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-orange-200/90">
            Wsparcie i ustawienia
          </p>
          <ul className="mt-4 space-y-3">
            {supportOptions.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-orange-200">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-white/60">{item.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
            <p className="font-semibold text-white">Witaj, {userLabel}</p>
            <p className="mt-1 text-white/60">
              {session ? "Możesz śledzić status swoich zamówień i płatności w czasie rzeczywistym." : "Zaloguj się, aby zapisywać ulubione miejsca i zamówienia."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [sessionState, setSessionState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSessionAndProfile() {
      setLoading(true);
      const { data: sess } = await supabase.auth.getSession();
      if (ignore) return;

      setSessionState(sess?.session ?? null);

      const user = sess?.session?.user;
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("id, email, user_type, restaurant_id")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        if (error) {
          console.error("profiles fetch error:", error);
          setProfile(null);
        } else {
          setProfile({ ...prof, email: prof?.email || user.email });
        }
        setLoading(false);
      }
    }

    loadSessionAndProfile();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSessionState(newSession);
      if (!newSession?.user) {
        setProfile(null);
      } else {
        (async () => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, email, user_type, restaurant_id")
            .eq("id", newSession.user.id)
            .single();
          setProfile({ ...prof, email: prof?.email || newSession.user.email });
        })();
      }
    });

    return () => {
      ignore = true;
      sub.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSessionState(null);
    setProfile(null);
  }

  const hasSession = !!sessionState;
  const isBiz = profile?.user_type === "business";

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#050506] text-white">
        <Navbar profile={profile} onSignOut={handleSignOut} hasSession={hasSession} />

        <main className="relative flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center px-4 py-20 text-white/70">Ładowanie…</div>
          ) : (
            <Routes>
              <Route path="/" element={<Home session={sessionState} profile={profile} />} />

              <Route
                path="/customer"
                element={
                  <ProtectedRoute when={hasSession} redirect="/">
                    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8">
                      <CustomerPanel userId={profile?.id} />
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/business"
                element={
                  <ProtectedRoute when={hasSession && isBiz} redirect="/customer">
                    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8">
                      <BusinessPanel profile={profile} />
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
