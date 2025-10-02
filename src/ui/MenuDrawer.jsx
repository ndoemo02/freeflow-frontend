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

  // Pogrupowane kategorie menu
  const menuSections = [
    {
      title: "🏠 Główne",
      icon: "🏠",
      items: [
        { to: "/", label: "Strona główna", icon: "🏠" },
        { to: "/cart", label: "Koszyk", icon: "🛒" }
      ]
    },
    {
      title: "🔐 Logowanie",
      icon: "🔐",
      items: [
        { to: "/panel/customer", label: "Klient", icon: "👤" },
        { to: "/panel/business", label: "Biznes", icon: "🏪" },
        { to: "/panel/taxi", label: "Taxi", icon: "🚕" },
        { to: "/panel/restaurant", label: "Restaurant", icon: "🍽️" },
        { to: "/panel/hotel", label: "Hotel", icon: "🏨" }
      ]
    },
    {
      title: "⚙️ Zarządzanie",
      icon: "⚙️", 
      items: [
        { to: "/admin", label: "Panel Admin", icon: "📊" },
        { to: "/business/register", label: "Rejestracja firmy", icon: "📝", highlight: true },
        { to: "/settings", label: "Ustawienia", icon: "⚙️" }
      ]
    },
    {
      title: "ℹ️ Pomoc",
      icon: "ℹ️",
      items: [
        { to: "/faq", label: "FAQ / Pomoc", icon: "❓" }
      ]
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop z blur */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          
          {/* Glassmorphism Sidebar */}
          <motion.aside
            role="dialog"
            aria-label="Menu"
            className="fixed top-0 right-0 z-50 h-full w-80 backdrop-blur-xl bg-white/10 border-l border-white/20 shadow-2xl"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                  FF
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">FreeFlow</h2>
                  <p className="text-white/70 text-sm">
                    {user ? `Witaj, ${user.email}` : 'Menu główne'}
                  </p>
                </div>
              </div>
              <button 
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 flex items-center justify-center border border-white/20"
                aria-label="Zamknij menu"
              >
                ✕
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {menuSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="space-y-2"
                >
                  {/* Section Header */}
                  <h3 className="text-white/60 text-xs uppercase font-semibold tracking-wider px-3 py-2">
                    {section.title}
                  </h3>
                  
                  {/* Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={close}
                        className={`
                          group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                          hover:bg-white/15 hover:backdrop-blur-md
                          ${item.highlight 
                            ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/30' 
                            : 'hover:border hover:border-white/10'
                          }
                        `}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className={`font-medium ${
                          item.highlight ? 'text-orange-200' : 'text-white/90 group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                        <span className="ml-auto text-white/40 group-hover:text-white/60 transition-colors">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Auth Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="border-t border-white/10 pt-6"
              >
                {!user ? (
                  <button
                    onClick={() => { close(); openAuth(); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <span>🔐</span>
                    Zaloguj się
                  </button>
                ) : (
                  <button
                    onClick={() => { signOut(); close(); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/90 font-medium hover:bg-white/20 transition-all duration-200"
                  >
                    <span>👋</span>
                    Wyloguj się
                  </button>
                )}
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}