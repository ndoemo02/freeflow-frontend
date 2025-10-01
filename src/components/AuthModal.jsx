// src/components/AuthModal.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState("password"); // "password" | "magic" | "google"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("customer"); // "customer" | "business" | "admin"
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { push } = useToast();

  if (!open) return null;

  async function signInWithPassword() {
    try {
      setErr(""); setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onClose?.();
    } catch (e) {
      setErr(e.message || "Nie udało się zalogować");
    } finally {
      setBusy(false);
    }
  }

  async function signUpWithPassword() {
    try {
      setErr("");
      setBusy(true);
  
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: selectedRole } }
      });
  
      if (error) throw error;
  
      // 🔎 Debug log
      console.log("Signup response:", data);
  
      // Obsługa przypadku: czasem jest data.user, czasem data.session.user
      const user = data.user ?? data.session?.user ?? null;
  
      if (user) {
        const { error: upErr } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: user.id,
              email: user.email,
              role: selectedRole || "customer",
            },
            { onConflict: "user_id" }
          );
  
        if (upErr) {
          console.warn("user_profiles upsert error:", upErr);
        }
      } else {
        console.warn("⚠️ Brak user w odpowiedzi Supabase, sprawdź confirm email.");
      }
  
      push("Zarejestrowano. Sprawdź email w celu weryfikacji.", "success");
      onClose?.();
  
    } catch (e) {
      setErr(e.message || "Nie udało się zarejestrować");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    try {
      setErr(""); setBusy(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
      push("Wysłaliśmy link logowania. Sprawdź skrzynkę ✉", "success");
      onClose?.();
    } catch (e) {
      setErr(e.message || "Nie udało się wysłać linku");
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    try {
      setErr(""); setBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (e) {
      setErr(e.message || "Błąd logowania Google");
      setBusy(false);
    }
  }

  const roleConfigs = {
    customer: { icon: "🙋", label: "Klient", desc: "Zamawiaj jedzenie" },
    business: { icon: "🏪", label: "Biznes", desc: "Zarządzaj restauracją" },
    admin: { icon: "⚙️", label: "Admin", desc: "Panel administracyjny" }
  };

  return (
    <div className="fixed inset-0 z-[110] animate-fadeInUp">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !busy && onClose?.()} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#1A1A1A]/95 backdrop-blur-xs p-6 shadow-soft-3xl">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Zaloguj się</h2>
          <p className="text-sm text-slate-400">Wybierz typ konta i wprowadź dane</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">Typ konta</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(roleConfigs).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedRole(key)}
                className={[
                  "flex flex-col items-center p-3 rounded-xl text-sm font-medium transition-all",
                  selectedRole === key
                    ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg scale-105"
                    : "bg-glass border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                ].join(" ")}
              >
                <div className="text-xl mb-1">{config.icon}</div>
                <span className="font-semibold">{config.label}</span>
                <span className="text-xs opacity-80">{config.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Method Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">Sposób logowania</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button" 
              onClick={() => setMode("password")} 
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition-all",
                mode === "password"
                  ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white"
                  : "bg-glass border border-white/10 text-slate-300 hover:bg-white/10"
              ].join(" ")}
            >
              Hasło
            </button>
            <button 
              type="button" 
              onClick={() => setMode("magic")} 
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition-all",
                mode === "magic"
                  ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white"
                  : "bg-glass border border-white/10 text-slate-300 hover:bg-white/10"
              ].join(" ")}
            >
              Magic Link
            </button>
            <button 
              type="button" 
              onClick={signInGoogle} 
              disabled={busy}
              className="rounded-xl px-3 py-2 text-sm font-medium bg-glass border border-white/10 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Google
            </button>
          </div>
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            className="w-full rounded-xl bg-glass border border-white/10 px-4 py-3 text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            type="email"
            placeholder="email@domena.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        {/* Password Mode */}
        {mode === "password" && (
          <>
            {/* Password Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Hasło</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl bg-glass border border-white/10 px-4 py-3 pr-12 text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  type={showPassword ? "text" : "password"}
                  placeholder="Wprowadź hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={busy}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!creating ? (
                <>
                  <button 
                    onClick={signInWithPassword} 
                    disabled={busy || !email || !password} 
                    className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-brand-400 hover:to-brand-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? "Logowanie..." : "Zaloguj się"}
                  </button>
                  <button 
                    onClick={() => setCreating(true)} 
                    disabled={busy} 
                    className="flex-1 rounded-xl bg-glass border border-white/10 px-6 py-3 font-semibold text-slate-300 transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                  >
                    Utwórz konto
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={signUpWithPassword} 
                    disabled={busy || !email || !password} 
                    className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-brand-400 hover:to-brand-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? "Rejestracja..." : "Zarejestruj się"}
                  </button>
                  <button 
                    onClick={() => setCreating(false)} 
                    disabled={busy} 
                    className="flex-1 rounded-xl bg-glass border border-white/10 px-6 py-3 font-semibold text-slate-300 transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                  >
                    Mam już konto
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Magic Link Mode */}
        {mode === "magic" && (
          <div className="mb-6">
            <button 
              onClick={sendMagicLink} 
              disabled={busy || !email} 
              className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-brand-400 hover:to-brand-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Wysyłanie..." : "Wyślij Magic Link"}
            </button>
          </div>
        )}

        {/* Error Message */}
        {err && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-200">
              <div className="text-red-400">⚠️</div>
              <span>{err}</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <button 
            className="w-full rounded-xl bg-glass border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-slate-300" 
            onClick={() => !busy && onClose?.()}
            disabled={busy}
          >
            Zamknij
          </button>
        </div>
        
      </div>
    </div>
  );
}