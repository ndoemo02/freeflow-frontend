// src/components/MenuDrawer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useToast } from "./Toast";
import AuthModal from "./AuthModal";

export default function MenuDrawer({ open, setOpen }) {
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const [showAuth, setShowAuth] = React.useState(false);

  return (
    <>
      {/* overlay */}
      <div
        className={[
          "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setOpen(false)}
      />
      {/* panel */}
      <aside
        className={[
          "fixed right-0 top-0 z-[101] h-full w-[86vw] max-w-sm border-l border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            {user ? (
              <>
                <div className="text-white">Zalogowany</div>
                <div className="text-slate-400 text-xs break-all">{user.email}</div>
              </>
            ) : (
              <div className="text-slate-400">Niezalogowany</div>
            )}
          </div>
          <button
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/15 hover:bg-white/15"
            onClick={() => setOpen(false)}
          >
            Zamknij
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <DrawerLink to="/" label="Strona główna" onClick={() => setOpen(false)} />
          <DrawerLink to="/faq" label="FAQ" onClick={() => setOpen(false)} />
          <DrawerLink to="/register-business" label="Zarejestruj firmę" onClick={() => setOpen(false)} />
          <DrawerLink to="/panel/customer" label="Panel klienta" onClick={() => setOpen(false)} />
          <DrawerLink to="/panel/business" label="Panel biznesu" onClick={() => setOpen(false)} />
          <DrawerLink to="/panel/taxi" label="🚗 Panel taxi" onClick={() => setOpen(false)} />
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                push("Wylogowano pomyślnie", "success");
                setOpen(false);
              }}
              className="w-full rounded-xl bg-red-500/90 px-4 py-2 font-medium text-white hover:bg-red-500"
            >
              Wyloguj się
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full rounded-xl bg-orange-500 px-4 py-2 font-medium text-slate-900"
            >
              Zaloguj się
            </button>
          )}
        </div>
      </aside>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function DrawerLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-slate-200 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}
