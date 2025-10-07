import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useUI } from "../state/ui"
import { useAuth } from "../state/auth"

export default function MenuDrawer() {
  const isOpen = useUI((s) => s.drawerOpen)
  const close = useUI((s) => s.closeDrawer)
  const openAuth = useUI((s) => s.openAuth)
  const { user, signOut } = useAuth()
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && isOpen && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Przeorganizowane kategorie menu
  const menuSections = [
    {
      id: "main",
      title: "Główne",
      icon: "🏠",
      items: [
        { to: "/", label: "Strona główna", icon: "🏠" },
        { to: "/cart", label: "Koszyk", icon: "🛒" }
      ]
    },
    {
      id: "user",
      title: "Użytkownik",
      icon: "👤",
      items: [
        { to: "/register", label: "Zarejestruj się", icon: "📝", desc: "Nowe konto", highlight: true },
        { to: "/panel/customer", label: "Panel Klienta", icon: "👤", desc: "Zamówienia i historia" }
      ]
    },
    {
      id: "business",
      title: "Biznes",
      icon: "🏪",
      items: [
        { to: "/business/register", label: "Rejestracja firmy", icon: "📝", desc: "Nowa firma", highlight: true },
        { to: "/panel/business", label: "Panel Biznesu", icon: "🏪", desc: "Zarządzanie firmą" },
        { to: "/panel/restaurant", label: "Panel Restauracji", icon: "🍽️", desc: "Menu i zamówienia" },
        { to: "/panel/taxi", label: "Panel Taxi", icon: "🚕", desc: "Przejazdy i kursy" },
        { to: "/panel/hotel", label: "Panel Hotelu", icon: "🏨", desc: "Rezerwacje i pokoje" }
      ]
    },
    {
      id: "admin",
      title: "Administracja",
      icon: "⚙️",
      items: [
        { to: "/admin", label: "Panel Admin", icon: "📊", desc: "Statystyki i analityka" },
        { to: "/settings", label: "Ustawienia", icon: "⚙️", desc: "Konfiguracja systemu" }
      ]
    },
    {
      id: "help",
      title: "Pomoc",
      icon: "ℹ️",
      items: [
        { to: "/faq", label: "FAQ / Pomoc", icon: "❓", desc: "Często zadawane pytania" }
      ]
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop z intensywniejszym blur */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          
          {/* Kompaktowe Menu z Glassmorphism */}
          <motion.aside
            role="dialog"
            aria-label="Menu"
            className="fixed top-4 right-4 z-50 w-80 max-h-[calc(100vh-2rem)] bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphism Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400/20 to-pink-500/20 backdrop-blur-sm border border-orange-400/30 flex items-center justify-center shadow-lg">
                  <span className="text-orange-300 font-bold text-lg">FF</span>
                </div>
                <h2 className="text-white font-bold text-lg bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent">FreeFlow</h2>
              </div>
              <button 
                onClick={close}
                className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 text-white/70 hover:text-white hover:bg-black/60 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-white/10"
                aria-label="Zamknij menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Kompaktowe Menu Content z Glassmorphism i przewijaniem */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
              {menuSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.05 }}
                  className="space-y-2"
                >
                  {/* Glassmorphism Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/50 hover:border-white/30 transition-all duration-300 group shadow-lg hover:shadow-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-lg">{section.icon}</span>
                      </div>
                      <span className="text-white font-semibold text-sm group-hover:text-orange-300 transition-colors duration-300">
                        {section.title}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections[section.id] ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white/60 group-hover:text-white transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                  
                  {/* Rozwijane Podkategorie z Glassmorphism */}
                  <AnimatePresence>
                    {expandedSections[section.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 space-y-2 border-l-2 border-white/20 pl-4">
                          {section.items.map((item, itemIndex) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={close}
                              className={`
                                group flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                                bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/40 hover:border-white/20
                                ${item.highlight 
                                  ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-400/30 shadow-lg' 
                                  : 'hover:shadow-white/10'
                                }
                              `}
                            >
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                <span className="text-sm">{item.icon}</span>
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${
                                  item.highlight ? 'text-orange-200' : 'text-white/90 group-hover:text-white'
                                }`}>
                                  {item.label}
                                </span>
                                {item.desc && (
                                  <p className="text-xs text-white/60 mt-1">{item.desc}</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Glassmorphism Auth Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-t border-white/20 pt-4 mt-4"
              >
                {!user ? (
                  <button
                    onClick={() => { close(); openAuth(); }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm border border-orange-400/20"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm">🔐</span>
                    </div>
                    Zaloguj się
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/20">
                      <div className="text-sm text-white/80 font-medium">
                        {user.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-white/60 mt-1">Zalogowany</div>
                    </div>
                    <button
                      onClick={() => { signOut(); close(); }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 text-white/90 font-medium text-sm hover:bg-black/60 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-sm">👋</span>
                      </div>
                      Wyloguj się
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}