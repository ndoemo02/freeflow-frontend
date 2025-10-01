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

  const menuItems = [
    { to: "/", icon: "🏠", label: "Strona główna" },
    { to: "/cart", icon: "🛒", label: "Koszyk" },
    { to: "/panel/customer", icon: "👤", label: "Panel klienta" },
    { to: "/panel/business", icon: "🏢", label: "Panel biznesowy" },
    { to: "/panel/taxi", icon: "🚕", label: "Panel kierowcy taxi" },
    { to: "/business/register", icon: "✨", label: "Rejestracja firmy", highlighted: true },
    { to: "/settings", icon: "⚙️", label: "Ustawienia" },
    { to: "/faq", icon: "❓", label: "FAQ / pomoc" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          
          {/* Menu Panel */}
          <motion.aside
            role="dialog"
            aria-label="Menu"
            className="fixed right-0 top-0 h-full w-[min(400px,85vw)] bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white">Menu</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {user ? `Witaj, ${user.email?.split('@')[0]}!` : 'Klient Prywatny'}
                </p>
              </motion.div>
              
              <motion.button
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
                onClick={close}
                aria-label="Zamknij"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 p-4 overflow-y-auto h-[calc(100%-140px)]">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link
                      className={`
                        group flex items-center gap-4 px-4 py-3 rounded-xl 
                        transition-all duration-200
                        ${item.highlighted 
                          ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 border border-brand-500/30 text-brand-400 hover:from-brand-500/30 hover:to-brand-600/30' 
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                        }
                      `}
                      to={item.to}
                      onClick={close}
                    >
                      <motion.span 
                        className="text-2xl"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {item.icon}
                      </motion.span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      <motion.span
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {/* Auth Button */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {!user ? (
                  <motion.button
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
                    onClick={() => { close(); openAuth(); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🔐 Zaloguj się
                  </motion.button>
                ) : (
                  <motion.button
                    className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
                    onClick={() => { signOut(); close(); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🚪 Wyloguj
                  </motion.button>
                )}
              </motion.div>
            </nav>

            {/* Footer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 border-t border-white/10 backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-gray-500 text-center">
                © 2025 FreeFlow • Voice to order
              </p>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
