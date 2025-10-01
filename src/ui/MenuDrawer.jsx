import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useUI } from "../state/ui"
import { useAuth } from "../state/auth"

export default function MenuDrawer() {
  const isOpen = useUI((s) => s.drawerOpen)
  const close = useUI((s) => s.closeDrawer)
  const openAuth = useUI((s) => s.openAuth)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && isOpen && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-label="Menu"
            className="fixed right-6 top-20 w-80 rounded-xl p-4 text-white bg-white/5 border border-white/10 shadow-soft-3xl backdrop-blur-xs z-50"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Klient Prywatny</div>
              <button className="rounded-md px-2 py-1 hover:bg-white/10" onClick={close} aria-label="Zamknij">✕</button>
            </div>
            <nav>
              <ul className="space-y-2 text-sm">
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/" onClick={close}>Strona główna</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/cart" onClick={close}>Koszyk</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/panel/customer" onClick={close}>Panel klienta</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/panel/business" onClick={close}>Panel biznesowy</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/panel/taxi" onClick={close}>Panel kierowcy taxi</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10 text-brand-500" to="/business/register" onClick={close}>Rejestracja firmy</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/settings" onClick={close}>Ustawienia</Link></li>
                <li><Link className="block px-2 py-2 rounded-md hover:bg-white/10" to="/faq" onClick={close}>FAQ / pomoc</Link></li>
                {!user ? (
                  <li><button className="w-full mt-2 py-2 rounded-xl border border-white/20 hover:bg-white/10" onClick={() => { close(); openAuth(); }}>Zaloguj się</button></li>
                ) : (
                  <li><button className="w-full mt-2 py-2 rounded-xl border border-red-600 text-red-300 hover:bg-red-600/10" onClick={() => { signOut(); close(); }}>Wyloguj</button></li>
                )}
              </ul>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
