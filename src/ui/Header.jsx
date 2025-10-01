import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useUI } from "../state/ui"
import { useAuth } from "../state/auth"
import AuthModal from "../components/AuthModal"

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false)
  const nav = useNavigate()
  const openDrawer = useUI((s) => s.openDrawer)
  const closeDrawer = useUI((s) => s.closeDrawer)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setAuthOpen(false)
        closeDrawer()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [closeDrawer])

  // removed data-open-auth listener (modal tylko z ikony usera)

  const drawerOpen = useUI((s) => s.drawerOpen)

  return (
    <>
      <motion.div 
        className="ff-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="ff-brand cursor-pointer"
          onClick={() => nav('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span 
            className="ff-brand__title ff-spring-in"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hi">Free</span>Flow
          </motion.span>
          <motion.div 
            className="ff-brand__subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Voice to order — Złóż zamówienie
          </motion.div>
        </motion.div>

        <div className="ff-header__actions">
          {/* USER / PANEL */}
          <motion.button 
            className="ff-header__btn group relative" 
            aria-label="User" 
            title={user ? "Panel" : "Zaloguj"}
            onClick={() => {
              if (user) return nav('/panel/customer')
              openDrawer()
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.svg 
              viewBox="0 0 24 24"
              animate={user ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 2, repeat: user ? Infinity : 0 }}
            >
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
            </motion.svg>
            {user && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              />
            )}
          </motion.button>

          {/* LOGOUT (tylko gdy zalogowany) */}
          {user && (
            <motion.button
              type="button"
              className="ff-header__btn"
              title="Wyloguj"
              aria-label="Wyloguj"
              onClick={signOut}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <svg viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
            </motion.button>
          )}

          {/* KOSZYK */}
          <motion.button 
            className="ff-header__btn relative" 
            aria-label="Cart" 
            title="Koszyk" 
            onClick={() => nav('/cart')}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.svg 
              viewBox="0 0 24 24"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <path d="M7 4h-2l-1 2h2l2.68 6.39-1.35 2.61A2 2 0 0 0 9 18h9v-2H9.42l.93-1.8h6.98a2 2 0 0 0 1.79-1.11l2.49-5.01H7.42L7 4zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </motion.svg>
          </motion.button>

          {/* MENU HAMBURGER - Animated */}
          <motion.button 
            className="ff-header__btn flex flex-col items-center justify-center gap-[5px] p-2" 
            aria-label="Menu" 
            title="Menu" 
            onClick={openDrawer}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.span
              className="block w-5 h-0.5 bg-current rounded-full"
              animate={drawerOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-0.5 bg-current rounded-full"
              animate={drawerOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-0.5 bg-current rounded-full"
              animate={drawerOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Modal logowania */}
      <AuthModal open={authOpen && !user} onClose={() => setAuthOpen(false)} />
    </>
  )
}

