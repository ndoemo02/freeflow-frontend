import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supa";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let ignore = false;

    async function redirectIfSessionExists() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!ignore && session) {
        navigate("/customer", { replace: true });
      }
    }

    redirectIfSessionExists();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password) {
      setError("Podaj adres e-mail i hasło.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      navigate("/customer", { replace: true });
    }

    setLoading(false);
  }

  async function handleMagicLink() {
    setError("");
    setInfo("");

    if (!email) {
      setError("Podaj adres e-mail, aby wysłać link.");
      return;
    }

    setMagicLoading(true);

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
    });

    if (magicError) {
      setError(magicError.message);
    } else {
      setInfo("Link logowania został wysłany na podany adres e-mail.");
    }

    setMagicLoading(false);
  }

  return (
    <section className="relative isolate overflow-hidden text-white">
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/Background.png"
          alt="Tło FreeFlow"
          className="h-full w-full object-cover object-center opacity-70"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05030A]/95 via-[#05030A]/90 to-[#05030A]/96" />

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
                  Zaloguj się do FreeFlow
                </h1>
              </div>
            </div>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-200/80 lg:mx-0">
              Wróć do swojego spersonalizowanego panelu i kontynuuj zamówienia głosem w restauracjach, taksówkach i hotelach.
              Po zalogowaniu zsynchronizujemy Twoje preferencje i historię.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-orange-200/70">
              Wyszukiwanie po lokalizacji
            </p>
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/45 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-orange-200/80">
                  <path
                    d="M12 2a7 7 0 0 0-7 7c0 4.55 5.23 10.36 6.16 11.3a1.2 1.2 0 0 0 1.68 0C13.77 19.36 19 13.55 19 9a7 7 0 0 0-7-7Zm0 15.3C9.56 14.47 7 10.84 7 9a5 5 0 0 1 10 0c0 1.84-2.56 5.47-5 8.3Zm0-11.3a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Wpisz miasto lub adres"
                  className="w-full bg-transparent text-sm text-white placeholder:text-zinc-300/60 focus:outline-none"
                  readOnly
                />
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300 sm:w-auto"
              >
                Zobacz demo
              </button>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-zinc-200/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="font-medium text-white">Spójny experience</p>
              <span className="mt-1 block text-xs text-orange-200/80">Ten sam układ na każdym ekranie</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="font-medium text-white">Błyskawiczne zamówienia</p>
              <span className="mt-1 block text-xs text-orange-200/80">Od logowania do finalizacji</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
              <p className="font-medium text-white">Bezpieczne logowanie</p>
              <span className="mt-1 block text-xs text-orange-200/80">Hasło lub link magiczny w jednym miejscu</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-white/90 lg:justify-start">
              {["Jedzenie", "Taxi", "Hotel"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200/85">
              <p className="font-semibold text-white">Wskazówka</p>
              <p className="mt-2 leading-relaxed">
                Po zalogowaniu zsynchronizujemy Twoje zamówienia na wszystkich urządzeniach i uruchomimy asystenta głosowego.
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
                <p className="font-semibold text-white">Zamawiaj głosem</p>
                <p className="mt-1 text-zinc-200/80">
                  Asystent FreeFlow prowadzi Cię krok po kroku przez kolejne zamówienia – wystarczy, że się zalogujesz.
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
        </div>

        <aside className="w-full max-w-sm space-y-6 self-center rounded-3xl border border-white/10 bg-black/55 p-6 shadow-2xl backdrop-blur lg:self-start">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Zaloguj się</h2>
            <p className="text-sm text-white/70">
              Użyj hasła lub wyślij link magiczny, aby uzyskać dostęp do panelu FreeFlow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-white/85">
              <span>Adres e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60"
                placeholder="nazwa@domena.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-white/85">
              <span>Hasło</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-black shadow transition hover:from-orange-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logowanie…" : "Zaloguj się"}
            </button>
          </form>

          <div className="space-y-3 text-center text-sm text-white/75">
            <p className="text-xs text-white/50">Lub wyślij link magiczny</p>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLoading}
              className="w-full rounded-2xl border border-white/20 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {magicLoading ? "Wysyłanie…" : "Wyślij magic link"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/65">
            <p>
              Masz problem z logowaniem? Napisz do nas na{" "}
              <span className="text-white">support@freeflow.ai</span>.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
