import React, { useEffect, useRef, useState } from "react"

export default function AmberTwoWay() {
  const [status, setStatus] = useState("🟡 Oczekiwanie...")
  const [socket, setSocket] = useState(null)
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)

  useEffect(() => {
    const connect = async () => {
      setStatus("🔵 Łączenie...");
      try {
        // 🔐 Pobierz token z backendu
        const tokenRes = await fetch("https://freeflow-backend.vercel.app/api/realtime-token")
        const { apiKey } = await tokenRes.json()

        // 🔊 Połączenie z GPT-4o Realtime
        const ws = new WebSocket(
          "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
          ["realtime", `openai-insecure-api-key.${apiKey}`]
        )
        setSocket(ws)

        ws.onopen = async () => 
          setStatus("🟢 Połączono – Amber słucha...")

          // 🔁 Ustaw kontekst Amber
          ws.send(JSON.stringify({
            type: "response.create",
            response: {
              instructions: "You are Amber, a warm, confident, female voice assistant for FreeFlow. Speak Polish naturally.",
              modalities: ["audio", "text"],
              conversation: {}