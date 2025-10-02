// src/components/AuthModal.jsx
import React, { useState } from "react";
import { useAuth } from "../state/auth";

export default function AuthModal({ onClose }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      onClose();
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signUp(email, password);
      onClose();
      alert("Rejestracja pomyślna! Sprawdź swój e-mail, aby potwierdzić konto.");
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  // Stan do kontrolowania animacji wejścia/wyjścia
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Czekaj na zakończenie animacji
  };

  return (
    <>
      {/* Tło (overlay) */}
      <div
        className="fixed inset-0 z-[102] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        className={[
          "ff-auth-sidebar fixed right-0 top-0 z-[103] h-full w-[90vw] max-w-sm border-l border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300",
          isClosing ? "translate-x-full" : "translate-x-0",
        ].join(" ")}
      >
        <div className="ff-menu-header">
          <h3>{isLoginView ? "👤 Logowanie" : "✍️ Rejestracja"}</h3>
          <button
            className="ff-menu-close"
            onClick={handleClose}
            aria-label="Zamknij panel"
          >
            ✕
          </button>
        </div>
        <div className="ff-menu-items">
          {isLoginView ? (
            <form className="ff-auth-form" onSubmit={handleLogin}>
              {/* Google login nie jest zaimplementowany */}
              <div className="ff-auth-divider"><span>lub</span></div>
              {error && <div className="text-red-400 text-sm text-center">{error}</div>}
              <input
                type="email"
                className="ff-input"
                placeholder="Adres e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="ff-input"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="ff-btn ff-btn--primary" disabled={loading}>
                {loading ? "Logowanie..." : "Zaloguj się"}
              </button>
              <div className="ff-auth-links">
                <button type="button" className="ff-auth-link" onClick={() => alert('Funkcja wkrótce!')}>Nie pamiętasz hasła?</button>
                <button type="button" className="ff-auth-link" onClick={() => setIsLoginView(false)}>Nie masz konta? Zarejestruj się</button>
              </div>
            </form>
          ) : (
            <form className="ff-auth-form" onSubmit={handleRegister}>
              {error && <div className="text-red-400 text-sm text-center">{error}</div>}
              <input
                type="email"
                className="ff-input"
                placeholder="Adres e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="ff-input"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="ff-input"
                placeholder="Powtórz hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" className="ff-btn ff-btn--primary" disabled={loading}>
                {loading ? "Rejestrowanie..." : "Zarejestruj się"}
              </button>
              <div className="ff-auth-links">
                <button type="button" className="ff-auth-link" onClick={() => setIsLoginView(true)}>Masz już konto? Zaloguj się</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}