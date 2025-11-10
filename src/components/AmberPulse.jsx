import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { CONFIG } from "../lib/config"

export default function AmberPulse({ sessionId = "session_test_001" }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // 🔄 automatyczne przewijanie
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput("")
    setLoading(true)
    setMessages((m) => [...m, { from: "user", text }])

    try {
      const apiUrl = `${CONFIG.BACKEND_URL}/api/brain`
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text }),
      })
      const data = await res.json()
      setLoading(false)
      if (data.reply) {
        setMessages((m) => [
          ...m,
          {
            from: "amber",
            text: data.reply,
            meta: data.meta || data.timings,
          },
        ])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setLoading(false)
      setMessages((m) => [
        ...m,
        {
          from: "amber",
          text: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
          meta: null,
        },
      ])
    }
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full">
      <div className="flex flex-col w-full max-w-2xl overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.from === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`px-4 py-2 max-w-[80%] rounded-2xl shadow-md ${
                  msg.from === "user"
                    ? "bg-neutral-800 text-white rounded-bl-none"
                    : "bg-indigo-500 text-white rounded-br-none"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                {msg.meta && (
                  <p className="text-[10px] opacity-60 mt-1">
                    NLU {Math.round(msg.meta.nluMs || 0)} ms • DB {Math.round(msg.meta.dbMs || 0)} ms • TTS {Math.round(msg.meta.ttsMs || 0)} ms
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <div className="px-4 py-2 bg-indigo-500 text-white rounded-2xl rounded-br-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* 🔘 pole input + logo */}
      <div className="w-full max-w-2xl flex items-center gap-2 p-3 border-t border-neutral-800">
        <img
          src="/images/amber zdjecie.jpg"
          alt="Amber"
          className="w-10 h-10 rounded-full object-cover animate-pulse"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Powiedz coś do Amber..."
          className="flex-1 bg-neutral-900 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? "..." : "Wyślij"}
        </button>
      </div>
    </div>
  )
}

