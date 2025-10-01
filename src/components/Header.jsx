// src/ui/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth";
import MenuDrawer from "../components/MenuDrawer";
import AuthModal from "../components/AuthModal";

export default function Header() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [showAuth, setShowAuth] = React.useState(false);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-orange-500">Free</span>
            <span className="text-2xl font-extrabold text-white">Flow</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/15 hover:bg-white/15"
              title="Koszyk"
            >
              🛒
            </button>
            <button
              className="rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/15 hover:bg-white/15"
              title={user ? "Konto" : "Zaloguj się"}
              onClick={() => (user ? setOpen(true) : setShowAuth(true))}
            >
              👤
            </button>
            <button
              className="rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/15 hover:bg-white/15"
              title="Menu"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <MenuDrawer open={open} setOpen={setOpen} />
      <AuthModal open={showAuth && !user} onClose={() => setShowAuth(false)} />
    </>
  );
}


