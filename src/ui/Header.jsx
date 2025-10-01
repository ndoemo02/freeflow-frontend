import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

  return (
    <>
      <div className="ff-header">
        <div className="ff-brand">
          <span className="ff-brand__title ff-spring-in">
            <span className="hi">Free</span>Flow
          </span>
          <div className="ff-brand__subtitle">Voice to order — Złóż zamówienie</div>
        </div>

        <div className="ff-header__actions">
          {/* USER / PANEL */}
          <button className="ff-header__btn" aria-label="User" title={user ? "Panel" : "Zaloguj"}
            onClick={() => {
              if (user) return nav('/panel/customer')
              // otwieramy teraz z menu, więc tylko pokaż menu
              openDrawer()
            }}>
            <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>
          </button>

          {/* LOGOUT (tylko gdy zalogowany) */}
          {user && (
            <button
              type="button"
              className="ff-header__btn"
              title="Wyloguj"
              aria-label="Wyloguj"
              onClick={signOut}
            >
              <svg viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
            </button>
          )}

          {/* KOSZYK – JUŻ NIE ZAGNIEŻDŻAMY PRZYCISKÓW */}
          <button className="ff-header__btn" aria-label="Cart" title="Koszyk" onClick={() => nav('/cart')}>
            <svg viewBox="0 0 24 24"><path d="M7 4h-2l-1 2h2l2.68 6.39-1.35 2.61A2 2 0 0 0 9 18h9v-2H9.42l.93-1.8h6.98a2 2 0 0 0 1.79-1.11l2.49-5.01H7.42L7 4zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
          </button>

          {/* MENU DRAWER */}
          <button className="ff-header__btn" aria-label="Menu" title="Menu" onClick={openDrawer}>
            <svg viewBox="0 0 24 24"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>
          </button>
        </div>
      </div>

      {/* Modal logowania */}
      <AuthModal open={authOpen && !user} onClose={() => setAuthOpen(false)} />
    </>
  )
}

