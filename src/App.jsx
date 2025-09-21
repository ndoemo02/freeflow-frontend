// src/App.jsx
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supa";
import CustomerPanel from "./pages/CustomerPanel.jsx";
import BusinessPanel from "./pages/BusinessPanel.jsx";

/** Prosty wrapper do sprawdzenia uprawnień na trasie */
function ProtectedRoute({ when, redirect = "/", children }) {
  if (!when) return <Navigate to={redirect} replace />;
  return children;
}

/** Pasek nawigacji oraz szybkie akcje */
function Navbar({ profile, onSignOut, isBiz }) {
  const location = useLocation();
  const navLinkBase =
    "rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15";

  return (
    <header className="relative z-20 px-4 pt-4 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border border-white/10 bg-black/50 px-4 py-3 text-white shadow-lg backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/images/Freeflow-logo.png"
            alt="Logo FreeFlow"
            className="h-10 w-10 rounded-full border border-white/20 bg-black/40 p-1 shadow"
          />
          <span className="text-2xl font-semibold tracking-tight">
            Free<span className="text-orange-400">Flow</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-3">
          <Link
            to="/customer"
            className={`${navLinkBase} ${
              location.pathname.startsWith("/customer")
                ? "bg-white/15 text-white"
                : "text-white/70"
            }`}
          >
            Panel klienta
          </Link>

          {isBiz ? (
            <Link
              to="/business"
              className={`${navLinkBase} ${
                location.pathname.startsWith("/business")
                  ? "bg-white/15 text-white"
                  : "text-white/70"
              }`}
            >
              Panel biznesowy
            </Link>
          ) : (
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/40">
              Panel biznesowy
            </span>
          )}

          {profile?.email && (
            <span className="hidden text-sm text-white/70 md:block">
              {profile.email}
            </span>
          )}

          {profile ? (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300"
            >
              Wyloguj
            </button>
          ) : (
            <Link
              to="/customer"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Zaloguj
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Strona główna */
function Home({ profile, session, isBiz }) {
  const loggedIn = Boolean(session);

  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-10 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/Background.png"
          alt="Tło FreeFlow"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#05030A]/95 via-[#05030A]/85 to-[#12071f]/60" />
      <div className="pointer-events-none absolute -left-24 top-48 -z-10 h-64 w-64 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-16 -z-10 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-center">
        <aside className="w-full max-w-xl space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex items-start gap-4">
              <img
                src="/images/Freeflowlogo.png"
                alt="FreeFlow"
                className="h-16 w-16 rounded-full border border-white/10 bg-black/50 p-2 shadow-lg"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-200/80">
                  Voice to order
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                  Złóż zamówienie w kilka sekund
                </h1>
                <p className="mt-3 text-base leading-relaxed text-zinc-200/80">
                  Wyszukaj restaurację, taxi lub usługę hotelową i zamów głosem z dowolnego miejsca.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-200/70">
                  Wyszukiwanie po lokalizacji
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 shadow-inner backdrop-blur">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 text-orange-200/80"
                  >
                    <path
                      d="M12 2a7 7 0 0 0-7 7c0 4.55 5.23 10.36 6.16 11.3a1.2 1.2 0 0 0 1.68 0C13.77 19.36 19 13.55 19 9a7 7 0 0 0-7-7Zm0 15.3C9.56 14.47 7 10.84 7 9a5 5 0 0 1 10 0c0 1.84-2.56 5.47-5 8.3Zm0-11.3a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z"
                      fill="currentColor"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Wpisz miasto lub adres"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-300/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-xs font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300"
                  >
                    Szukaj
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/customer"
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                      Klient prywatny
                    </Link>
                    {isBiz ? (
                      <Link
                        to="/business"
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        Firma
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/40">
                        Firma
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-zinc-200/80">
                    <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                      <span>Wsparcie &amp; ustawienia</span>
                      <span className="text-xs text-orange-200/80">FAQ / pomoc</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                      <span>Ustawienia aplikacji</span>
                      <span className="text-xs text-orange-200/80">Personalizuj</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                      <span>Apka / nauka</span>
                      <span className="text-xs text-orange-200/80">Poznaj funkcje</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-zinc-200/85">
                  <p className="font-semibold text-white">Status konta</p>
                  {loggedIn ? (
                    <p className="mt-2 leading-relaxed">
                      Zalogowano jako {" "}
                      <span className="font-medium text-white">
                        {profile?.email ?? "użytkownik"}
                      </span>
                      . Wybierz panel i kontynuuj zamówienia z FreeFlow.
                    </p>
                  ) : (
                    <p className="mt-2 leading-relaxed">
                      Nie jesteś zalogowany. Skorzystaj z przycisku „Zaloguj”, aby przejść do panelu i zacząć zamawiać głosem.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <Link
              to="/customer"
              className="rounded-full border border-white/20 px-5 py-2 transition hover:bg-white/10"
            >
              Przejdź do panelu klienta
            </Link>
            {isBiz ? (
              <Link
                to="/business"
                className="rounded-full border border-white/20 px-5 py-2 transition hover:bg-white/10"
              >
                Panel biznesowy
              </Link>
            ) : (
              <span className="rounded-full border border-white/10 px-5 py-2 text-white/40">
                Panel biznesowy dostępny dla kont firmowych
              </span>
            )}
          </div>
        </aside>

        <div className="relative flex-1">
          <div className="relative ml-auto max-w-xl rounded-[2.5rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-200/70">
                  VoiceFlow Assistant
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  Inteligentny partner zamówień
                </h2>
                <p className="mt-3 text-base leading-relaxed text-zinc-200/80">
                  Rozmawiaj naturalnie, a my znajdziemy restaurację, taxi lub hotel w Twojej okolicy.
                </p>
              </div>
              <img
                src="/images/Freeflowlogo.png"
                alt="FreeFlow"
                className="h-24 w-24 self-end drop-shadow-[0_20px_45px_rgba(255,138,48,0.35)] sm:h-28 sm:w-28"
              />
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap gap-3">
                {["Jedzenie", "Taxi", "Hotel"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/20"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
                <p className="text-sm text-zinc-200/85">
                  {loggedIn
                    ? `Cześć ${profile?.email ?? "w FreeFlow"}! Wybierz usługę lub poproś asystenta o złożenie kolejnego zamówienia.`
                    : "Powiedz: „Zamów makaron w najlepszej włoskiej restauracji w pobliżu”. Asystent poprowadzi Cię krok po kroku."}
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl bg-white/10 p-5 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-black shadow-lg">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path
                      d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H6a6 6 0 0 0 12 0h-1Zm-5 7a7 7 0 0 0 7-7h-1a6 6 0 0 1-12 0H5a7 7 0 0 0 7 7Zm-1 2h2v-2h-2v2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="text-sm text-zinc-100/85 sm:flex-1">
                  <p className="font-semibold text-white">Rozpocznij rozmowę</p>
                  <p className="mt-1 text-zinc-200/80">
                    Dotknij przycisku i mów naturalnie – FreeFlow rozpozna Twoje potrzeby i zaproponuje najlepsze opcje.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-2 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300"
                >
                  Mów teraz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Główny App */
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // pobierz sesję i profil
  useEffect(() => {
    let ignore = false;

    async function loadSessionAndProfile() {
      setLoading(true);
      const { data: sess } = await supabase.auth.getSession();
      if (ignore) return;

      setSession(sess?.session ?? null);

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
          setProfile({ email: user.email, id: user.id });
        } else {
          // fallback na email z auth jeśli brak w profiles
          setProfile({ ...prof, email: prof?.email || user.email });
        }
        setLoading(false);
      }
    }

    loadSessionAndProfile();

    // nasłuchuj zmian sesji (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
    setSession(null);
    setProfile(null);
  }

  const isBiz = profile?.user_type === "business";

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#05030A] text-white">
        <Navbar profile={profile} onSignOut={handleSignOut} isBiz={isBiz} />

        <main className="flex-1">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/70 shadow">
                Ładowanie danych…
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={<Home profile={profile} session={session} isBiz={isBiz} />}
              />

              {/* Panel klienta – wymaga zalogowania */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute when={!!session} redirect="/">
                    <div className="mx-auto w-full max-w-5xl px-6 py-10">
                      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur">
                        <CustomerPanel userId={profile?.id} />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Panel biznesowy – wymaga roli business */}
              <Route
                path="/business"
                element={
                  <ProtectedRoute when={!!session && isBiz} redirect="/customer">
                    <div className="mx-auto w-full max-w-5xl px-6 py-10">
                      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur">
                        <BusinessPanel user={profile} />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
