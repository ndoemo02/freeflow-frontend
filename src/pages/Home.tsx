import { useState } from "react"
import gsap from "gsap"
import { useUI } from "../state/ui"
// @ts-ignore
import { useCart } from "../state/CartContext"
// @ts-ignore
import Cart from "../components/Cart"
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer"
import VoicePanelText from "../components/VoicePanelText"
import Switch from "../components/Switch"
import "./Home.css"

export default function Home() {
  const [showTextPanel, setShowTextPanel] = useState(false)
  const openDrawer = useUI((s) => s.openDrawer)
  const { setIsOpen } = useCart()

  const toggleUI = (checked: boolean) => {
    setShowTextPanel(checked)
    const tiles = document.querySelectorAll(".tiles, .tile")
    gsap.to(tiles, {
      y: checked ? 80 : 0,
      opacity: checked ? 0 : 1,
      filter: checked ? "blur(6px)" : "blur(0px)",
      duration: 0.5,
      ease: "power2.inOut",
      stagger: 0.03
    })
  }

  const handleLogoClick = () => {
    setShowTextPanel(!showTextPanel)
    toggleUI(!showTextPanel)
  }

  return (
    <div className="freeflow">
      <Switch onToggle={toggleUI} />
      {/* Header z menu i koszykiem */}
      <header className="top-header">
        <div className="header-left">
          <h1><span>Free</span>Flow</h1>
          <p>Voice to order — Złóż zamówienie<br/>Restauracja, taxi albo hotel?</p>
              </div>

        <div className="header-right">
          {/* Koszyk */}
                  <button
                    onClick={() => setIsOpen(true)}
            className="cart-btn"
                    title="Koszyk"
                  >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </button>
          
          
          {/* Menu */}
                  <button
                    onClick={openDrawer}
            className="menu-btn"
                  >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
          </div>
        </header>


      <div className="logo-container" onClick={handleLogoClick}>
        <img src="/images/Freeflowlogo.png" alt="FreeFlow" className="logo" />
        <div className="amber-status">
          <span>Amber:</span> <div className="dot" /> Gotowa
              </div>
              </div>

      <div className="tiles" style={{ pointerEvents: showTextPanel ? 'none' : 'auto' }}>
        <div className="tile"><img src="/icons/food.png" alt="Jedzenie" /></div>
        <div className="tile"><img src="/icons/car.png" alt="Taxi" /></div>
        <div className="tile"><img src="/icons/hotel.png" alt="Hotel" /></div>
        </div>

      {/* VoicePanelText - dolny środek (widoczny gdy przełącznik włączony) */}
      {showTextPanel && <VoicePanelText />}

      {/* PstrykPanel usunięty na życzenie */}

      {/* MenuDrawer i Cart */}
      <MenuDrawer />
      <Cart />
        </div>
  )
}