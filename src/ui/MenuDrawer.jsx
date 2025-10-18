import React, { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useUI } from "../state/ui"
import { useAuth } from "../state/auth"
import { getMenu } from "../lib/menuBuilder"

export default function MenuDrawer() {
  const isOpen = useUI((s) => s.drawerOpen)
  const close = useUI((s) => s.closeDrawer)
  const openAuth = useUI((s) => s.openAuth)
  const { user, signOut } = useAuth()
  const [expandedSections, setExpandedSections] = useState({})

  // Generuj menu dynamicznie na podstawie użytkownika i środowiska
  const menuSections = useMemo(() => {
    const env = import.meta.env.MODE || 'production'
    return getMenu(user, env)
  }, [user])

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
            className="fixed top-4 right-4 z-50 w-80 h-[calc(100vh-2rem)] bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
              {menuSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.02, duration: 0.15 }}
                  className="space-y-2"
                >
                  {/* Glassmorphism Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/50 hover:border-white/30 transition-all duration-150 group shadow-lg hover:shadow-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-lg">{section.icon}</span>
                      </div>
                      <span className="text-white font-semibold text-sm group-hover:text-orange-300 transition-colors duration-150">
                        {section.title}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections[section.id] ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="text-white/60 group-hover:text-white transition-colors duration-200"
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
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 space-y-2 border-l-2 border-white/20 pl-4">
                          {section.items.map((item, itemIndex) => {
                            // Sprawdź czy to specjalna akcja (np. voice toggle)
                            const isSpecialAction = item.to.startsWith('#')

                            const itemContent = (
                              <>
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
                                {item.badge && (
                                  <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                                {item.devOnly && (
                                  <span className="px-2 py-1 text-xs font-bold bg-purple-500/50 text-purple-200 rounded-full">
                                    DEV
                                  </span>
                                )}
                              </>
                            )

                            const className = `
                              group flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                              bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/40 hover:border-white/20
                              ${item.highlight
                                ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-400/30 shadow-lg'
                                : 'hover:shadow-white/10'
                              }
                            `

                            // Jeśli to specjalna akcja, renderuj jako button
                            if (isSpecialAction) {
                              return (
                                <button
                                  key={item.id || item.to}
                                  onClick={() => {
                                    // Tutaj można dodać obsługę specjalnych akcji
                                    console.log('Special action:', item.to)
                                    close()
                                  }}
                                  className={className}
                                >
                                  {itemContent}
                                </button>
                              )
                            }

                            // Normalny link
                            return (
                              <Link
                                key={item.id || item.to}
                                to={item.to}
                                onClick={close}
                                className={className}
                              >
                                {itemContent}
                              </Link>
                            )
                          })}
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
                  <div className="space-y-3">
                    {/* Przycisk logowania */}
                    <button
                      onClick={() => { close(); openAuth(); }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm border border-orange-400/20"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-sm">🔐</span>
                      </div>
                      Zaloguj się
                    </button>
                    
                    {/* Przycisk rejestracji */}
                    <button
                      onClick={() => { close(); openAuth(); }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm border border-blue-400/20"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-sm">📝</span>
                      </div>
                      Zarejestruj się
                    </button>
                  </div>
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