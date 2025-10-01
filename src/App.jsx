import React, { useState } from 'react'
import Header from './components/Header'
import MenuDrawer from './components/MenuDrawer'
import AuthModal from './components/AuthModal'
import { ToastProvider } from './components/ToastContext'
import Hero from './components/Hero'
import FAQAccordion from './components/FAQAccordion'

function App(){
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  return (
    <ToastProvider>
      <div className="min-h-screen text-white bg-gradient-to-b from-black to-[#07101a]">
        <Header onOpenMenu={()=>setMenuOpen(true)} onOpenAuth={()=>setAuthOpen(true)} />
        <MenuDrawer open={menuOpen} onClose={()=>setMenuOpen(false)} />
        <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onLogin={(email)=>{console.log('login', email); setAuthOpen(false)}} />
        <main className="pt-28">
          <Hero onMic={()=>console.log('mic')} />
          <section className="py-16">
            <h3 className="text-center text-2xl mb-6">FAQ</h3>
            <FAQAccordion items={[
              {q:'Jak mogę się zarejestrować?', a:'Przez Magic Link w modal...', category:'Rejestracja'},
              {q:'Jak złożyć zamówienie głosowe?', a:'Naciśnij mikrofon i mów', category:'Zamówienia'}
            ]}/>
          </section>
        </main>
      </div>
    </ToastProvider>
  )
}
export default App

// src/App.jsx
import React from "react";
import HomeClassic from "./pages/HomeClassic";

export default function App() {
  return <HomeClassic />;
}