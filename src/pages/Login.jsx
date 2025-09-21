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
    <section className="relative isolate flex min-h-[70vh] items-center justify-center px-4 py-16 text-white">
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/Background.png"
          alt="Tło"
          className="h-full w-full object-cover object-center opacity-60"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05030A]/95 via-[#05030A]/90 to-[#05030A]/96" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-black/50 p-8 shadow-xl backdrop-blur">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Zaloguj się</h1>
          <p className="text-sm text-white/70">
            Użyj hasła lub wyślij link magiczny, aby uzyskać dostęp do panelu klienta.
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

        <div className="mt-6 space-y-3 text-center text-sm text-white/75">
          <p className="text-xs text-white/50">Lub</p>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="w-full rounded-2xl border border-white/20 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {magicLoading ? "Wysyłanie…" : "Wyślij magic link"}
          </button>
        </div>
      </div>
    </section>
  );
}
