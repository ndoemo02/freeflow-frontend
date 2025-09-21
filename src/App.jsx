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
import Login from "./pages/Login.jsx";

/** Prosty wrapper do sprawdzenia uprawnień na trasie */
function ProtectedRoute({ when, redirect = "/", children }) {
  if (!when) return <Navigate to={redirect} replace />;
  return children;
}

/** Pasek nawigacji oraz szybkie akcje */
function Navbar({ profile, onSignOut, isBiz }) {
  const location = useLocation();
  const navLinkBase =
        
    "rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium tracking-tight transition hover:bg-white/15 sm:px-4 sm:text-sm";

  return (
    <header className="relative z-20 px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-white shadow-lg backdrop-blur">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img
            src="/images/Freeflow-logo.png"
            alt="Logo FreeFlow"
            className="h-9 w-9 rounded-full border border-white/20 bg-black/40 p-1 shadow"
          />
          <span className="text-xl font-semibold tracking-tight sm:text-2xl">

            Free<span className="text-orange-400">Flow</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-2 sm:gap-3">

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
          
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45 sm:px-4 sm:text-sm">

              Panel biznesowy
            </span>
          )}

          {profile?.email && (

            <span className="hidden text-xs text-white/65 md:block md:text-sm">

              {profile.email}
            </span>
          )}

          {profile ? (
            <button
              type="button"
              onClick={onSignOut}

              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-xs font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300 sm:text-sm"

            >
              Wyloguj
            </button>
          ) : (
            <Link
              to="/login"

              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 sm:text-sm"

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

    <section className="relative isolate overflow-hidden text-white">

      <div className="absolute inset-0 -z-20">
        <img
          src="/images/Background.png"
          alt="Tło FreeFlow"

          className="h-full w-full object-cover object-center opacity-70"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05030A]/95 via-[#05030A]/88 to-[#05030A]/96" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-14 sm:px-6 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex-1 space-y-10 text-center lg:text-left">
          <div className="space-y-5">
            <div className="mx-auto flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 shadow-lg backdrop-blur-sm lg:mx-0">
              <img
                src="/images/Freeflowlogo.png"
                alt="FreeFlow"
                className="h-12 w-12 rounded-full border border-white/15 bg-black/50 p-2 shadow"
              />
              <div className="text-left">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-orange-200/80">
                  Voice to order
                </p>
                <h1 className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl lg:text-4xl">
                  Złóż zamówienie w kilka sekund
                </h1>
              </div>
            </div>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-200/80 lg:mx-0">
              Wyszukaj restaurację, taxi lub usługę hotelową i zamów głosem z dowolnego miejsca. FreeFlow prowadzi Cię krok po kroku, zachowując czytelny układ także na małych ekranach.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-orange-200/70">
              Wyszukiwanie po lokalizacji
            </p>
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/45 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2">
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
                  className="w-full bg-transparent text-sm text-white placeholder:text-zinc-300/60 focus:outline-none"
                />
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300 sm:w-auto"
              >
                Szukaj
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-white/90 lg:justify-start">
              <Link
                to="/customer"
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 transition hover:bg-white/20"
              >
                Klient prywatny
              </Link>
              {isBiz ? (
                <Link
                  to="/business"
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 transition hover:bg-white/20"
                >
                  Firma
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-white/45">
                  Firma
                </span>
              )}
            </div>

            <div className="grid gap-3 text-sm text-zinc-200/80 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="font-medium text-white">Wsparcie &amp; ustawienia</p>
                <span className="mt-1 block text-xs text-orange-200/80">FAQ / pomoc</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="font-medium text-white">Ustawienia aplikacji</p>
                <span className="mt-1 block text-xs text-orange-200/80">Personalizuj</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
                <p className="font-medium text-white">Apka / nauka</p>
                <span className="mt-1 block text-xs text-orange-200/80">Poznaj funkcje</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200/85">
              <p className="font-semibold text-white">Status konta</p>
              {loggedIn ? (
                <p className="mt-2 leading-relaxed">
                  Zalogowano jako{" "}
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

          <div className="flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">

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

              <span className="rounded-full border border-white/10 px-5 py-2 text-white/45">

                Panel biznesowy dostępny dla kont firmowych
              </span>
            )}
          </div>

        </div>

        <aside className="w-full max-w-sm space-y-6 self-center rounded-3xl border border-white/10 bg-black/55 p-6 shadow-2xl backdrop-blur lg:self-start">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-orange-200/70">
                VoiceFlow Assistant
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                Inteligentny partner zamówień
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-200/80">
                Rozmawiaj naturalnie, a znajdziemy restaurację, taxi lub hotel w Twojej okolicy.
              </p>
            </div>
            <img
              src="/images/Freeflowlogo.png"
              alt="FreeFlow"
              className="h-20 w-20 self-end drop-shadow-[0_18px_35px_rgba(255,138,48,0.28)] sm:h-24 sm:w-24"
            />
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {["Jedzenie", "Taxi", "Hotel"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 sm:px-5 sm:text-sm"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-200/85">
              <p>
                {loggedIn
                  ? `Cześć ${profile?.email ?? "w FreeFlow"}! Wybierz usługę lub poproś asystenta o złożenie kolejnego zamówienia.`
                  : "Powiedz: „Zamów makaron w najlepszej włoskiej restauracji w pobliżu”. Asystent poprowadzi Cię krok po kroku."}
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-white/10 p-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-black shadow-lg sm:h-14 sm:w-14">
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true">
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
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300 sm:w-auto"
              >
                Mów teraz
              </button>
            </div>
          </div>
        </aside>

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("signOut error:", error);
    }
    setSession(null);
    setProfile(null);
    window.location.replace("/login");
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
                  <ProtectedRoute when={!!session} redirect="/login">
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

              <Route path="/login" element={<Login />} />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
