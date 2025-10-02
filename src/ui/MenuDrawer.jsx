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

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  // Pogrupowane kategorie menu - nowa struktura
  const menuSections = [
    {
      title: "Ogólne",
      icon: "🏠",
      items: [
        { to: "/", label: "Strona główna", icon: "🏠" },
        { to: "/cart", label: "Koszyk", icon: "🛒" },
        { to: "/faq", label: "FAQ / Pomoc", icon: "❓" }
      ]
    },
    {
      title: "Logowanie",
      icon: "🔐",
      items: [
        { to: "/panel/customer", label: "Panel Klienta", icon: "👤" },
        { to: "/panel/business", label: "Panel Biznesu", icon: "🏪" },
        { to: "/panel/taxi", label: "Panel Taxi", icon: "🚕" },
        { to: "/panel/restaurant", label: "Panel Restauracji", icon: "🍽️" },
        { to: "/panel/hotel", label: "Panel Hotelu", icon: "🏨" }
      ]
    },
    {
      title: "Zarządzanie",
      icon: "⚙️",
      expandable: true,
      items: [
        { to: "/admin", label: "Panel Administratora", icon: "📊", category: "admin" },
        { to: "/business/register", label: "Rejestracja firmy", icon: "📝", category: "business", highlight: true },
        { to: "/settings", label: "Ustawienia", icon: "⚙️", category: "settings" }
      ],
      subcategories: {
        admin: [
          { to: "/admin/users", label: "Zarządzanie użytkownikami", icon: "👥" },
          { to: "/admin/analytics", label: "Analityka", icon: "📈" },
          { to: "/admin/reports", label: "Raporty", icon: "📋" }
        ],
        business: [
          { to: "/business/register", label: "Rejestracja firmy", icon: "📝" },
          { to: "/business/dashboard", label: "Dashboard biznesu", icon: "📊" },
          { to: "/business/orders", label: "Zamówienia", icon: "📦" }
        ],
        settings: [
          { to: "/settings/profile", label: "Profil", icon: "👤" },
          { to: "/settings/notifications", label: "Powiadomienia", icon: "🔔" },
          { to: "/settings/security", label: "Bezpieczeństwo", icon: "🔒" }
        ]
      }
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
          
          {/* Modern Popup Menu */}
          <motion.aside
            role="dialog"
            aria-label="Menu"
            className="ff-menu-drawer"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ff-menu-drawer__header">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                  FF
                </div>
                <div>
                  <h2 className="ff-menu-drawer__title">FreeFlow</h2>
                  <p className="text-white/70 text-sm">
                    {user ? `Witaj, ${user.email}` : 'Menu główne'}
                  </p>
                </div>
              </div>
              <button 
                onClick={close}
                className="ff-menu-drawer__close-btn"
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
                  <div className="ff-menu-section-header">
                    <h3 className="ff-menu-section-title">
                      {section.title}
                    </h3>
                    {section.expandable && (
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="ff-menu-expand-btn"
                      >
                        <motion.span
                          animate={{ rotate: expandedSections[section.title] ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          ▼
                        </motion.span>
                      </button>
                    )}
                  </div>
                  
                  {/* Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <div key={item.to}>
                        <Link
                          to={item.to}
                          onClick={close}
                          className={`ff-menu-drawer__link ${item.highlight ? 'ff-menu-drawer__link--brand' : ''}`}
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
                        
                        {/* Subcategories for expandable sections */}
                        {section.expandable && section.subcategories && item.category && expandedSections[section.title] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ff-menu-subcategory"
                          >
                            {section.subcategories[item.category]?.map((subItem, subIndex) => (
                              <Link
                                key={subItem.to}
                                to={subItem.to}
                                onClick={close}
                                className="ff-menu-subcategory-item"
                              >
                                <span className="ff-menu-subcategory-icon">{subItem.icon}</span>
                                <span className="ff-menu-subcategory-label">{subItem.label}</span>
                                <span className="ff-menu-subcategory-arrow">→</span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </div>
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
                    className="ff-menu-drawer__auth-btn w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <span>🔐</span>
                    Zaloguj się
                  </button>
                ) : (
                  <button
                    onClick={() => { signOut(); close(); }}
                    className="ff-menu-drawer__auth-btn w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/90 font-medium hover:bg-white/20 transition-all duration-200"
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