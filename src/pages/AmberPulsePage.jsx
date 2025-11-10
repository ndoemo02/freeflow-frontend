import { useState } from "react"
import AmberPulse from "../components/AmberPulse"

export default function AmberPulsePage() {
  // 🔥 Przechowuj sessionId w localStorage aby nie gubić kontekstu
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("amber-pulse-session-id")
    if (stored) return stored
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("amber-pulse-session-id", newId)
    return newId
  })
  
  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col">
      <header className="p-4 text-center text-xl font-bold text-indigo-400 border-b border-neutral-800">
        Amber Smart Choice
      </header>
      <main className="flex-1 flex justify-center items-center overflow-hidden">
        <AmberPulse sessionId={sessionId} />
      </main>
    </div>
  )
}

