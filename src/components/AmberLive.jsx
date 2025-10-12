import React, { useEffect, useRef, useState } from "react"

export default function AmberLive() {
  const [status, setStatus] = useState("idle")
  const audioRef = useRef(null)
  let ws

  async function connect() {
    setStatus("connecting")
    const token = await fetch("/api/realtime-token").then(r => r.json())
    ws = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
      ["realtime", `openai-insecure-api-key.${token.apiKey}`]
    )

    ws.onopen = () => {
      setStatus("connected")
      ws.send(JSON.stringify({
        type: "response.create",
        response: { instructions: "You are Amber, a calm, witty assistant helping in the FreeFlow app." }
      }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "response.audio.delta") {
        const audio = new Audio("data:audio/wav;base64," + msg.delta)
        audio.play()
      }
    }

    ws.onclose = () => setStatus("disconnected")
  }

  useEffect(() => { connect() }, [])

  return (
    <div style={{textAlign:"center",padding:"2rem"}}>
      <h2>🎙️ Amber Live</h2>
      <p>Status: {status}</p>
      <audio ref={audioRef} autoPlay />
    </div>
  )
}