import { useState, useEffect, useCallback, useRef } from "react"
import { useUI } from "../state/ui"
// @ts-ignore
import { useCart } from "../state/CartContext"
// @ts-ignore
import Cart from "../components/Cart"
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer"
import VoicePanelText from "../components/VoicePanelText"
import VoiceTextPanel from "../components/VoiceTextPanel"
import ChatBubbles from "../components/ChatBubbles"
import Switch from "../components/Switch"
import LogoFreeFlow from "../components/LogoFreeFlow.jsx"
// @ts-ignore
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import "./Home.css"
import { CONFIG } from "../lib/config"

export default function Home() {
  const [showTextPanel, setShowTextPanel] = useState(false)
  const [voiceQuery, setVoiceQuery] = useState("")
  const [amberResponse, setAmberResponse] = useState("")
  const [userMessage, setUserMessage] = useState("")
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string; cuisine_type?: string; city?: string }>>([])
  const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string; price_pln: number; category?: string }>>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const openDrawer = useUI((s) => s.openDrawer)
  const { setIsOpen, addToCart } = useCart()

  // 🔥 Przechowuj sessionId w localStorage aby nie gubić kontekstu
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("amber-session-id")
    if (stored) return stored
    const newId = `session-${Date.now()}`
    localStorage.setItem("amber-session-id", newId)
    return newId
  })

  // 🔥 Ref do zapobiegania wielokrotnemu wysyłaniu tego samego tekstu
  const lastSentTextRef = useRef("")

  // 📍 Geolokalizacja użytkownika (opcjonalna)
  const [coords, setCoords] = useState<{ lat: number|null; lng: number|null }>({ lat: null, lng: null })
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        // brak zgody lub błąd – pomijamy
        setCoords({ lat: null, lng: null })
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    )
  }, [])

  // Hook do rozpoznawania mowy
  const {
    recording,
    interimText,
    finalText,
    setFinalText,
    startRecording,
    stopRecording,
  } = useSpeechRecognition({
    onTranscriptChange: (transcript: string) => {
      console.log("Transkrypcja:", transcript)
      setVoiceQuery(transcript)
    },
  })

  const toggleUI = (checked: boolean) => {
    setShowTextPanel(checked)
    // Kafelki ukrywają się automatycznie przez klasę CSS .hidden
  }

  const handleLogoClick = () => {
    // Przełącz nagrywanie głosu
    if (recording) {
      stopRecording()
      console.log("⏹️ Zatrzymano nagrywanie")
      console.log("📝 Aktualna transkrypcja:", voiceQuery)
    } else {
      startRecording()
      console.log("▶️ Rozpoczęto nagrywanie")
      // Automatycznie pokaż panel tekstowy podczas nagrywania
      if (!showTextPanel) {
        setShowTextPanel(true)
        toggleUI(true)
      }
    }
  }

  // Wysyłanie do Amber Brain API
  const sendToAmberBrain = useCallback(async (text: string) => {
    try {
      // Jeśli user pyta o "w pobliżu" i nie mamy współrzędnych – spróbuj pobrać on-demand
      const needsGeo = /w pobliżu|w poblizu|blisko|gdzie moge zjesc|gdzie mogę zjeść|gdzie zjesc|gdzie zjeść/i.test(text)
      let finalLat = coords.lat
      let finalLng = coords.lng
      if (needsGeo && (finalLat == null || finalLng == null) && 'geolocation' in navigator) {
        console.log('📍 On-demand geolocation...')
        try {
          const position: GeolocationPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              maximumAge: 20000,
              timeout: 8000,
            })
          })
          finalLat = position.coords.latitude
          finalLng = position.coords.longitude
          setCoords({ lat: finalLat, lng: finalLng })
        } catch (e) {
          console.warn('⚠️ Geolocation on-demand failed:', e)
        }
      }

      const apiUrl = `${CONFIG.BACKEND_URL}/api/brain`
      console.log("📡 Wysyłam do Amber Brain:", text)
      console.log("🌐 URL:", apiUrl)
      console.log("📦 Body:", { text, sessionId, includeTTS: true, lat: finalLat, lng: finalLng })
      console.log("🔑 Using sessionId:", sessionId)
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          sessionId: sessionId, // 🔥 Użyj persystentnego sessionId
          lat: finalLat ?? undefined,
          lng: finalLng ?? undefined,
          includeTTS: true, // Włącz TTS
        }),
      })

      console.log("📥 Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Response error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("🧠 Odpowiedź Amber:", data)

      // Zapisz wiadomość użytkownika
      setUserMessage(text)

      // Pokaż odpowiedź
      if (data.reply) {
        console.log("✅ Ustawiam odpowiedź Amber:", data.reply)
        setAmberResponse(data.reply)
        
        // Zapisz restauracje z odpowiedzi (bezpośrednio z data.restaurants)
        if (data.restaurants && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
          console.log("📍 Restauracje znalezione:", data.restaurants.length)
          setRestaurants(data.restaurants.map((r: any) => ({
            id: r.id || '',
            name: r.name || '',
            cuisine_type: r.cuisine_type || '',
            city: r.city || ''
          })))
        } else {
          setRestaurants([])
        }
        
        // Zapisz menu items z meta.menu lub context.last_menu
        if (data.meta?.menu && Array.isArray(data.meta.menu) && data.meta.menu.length > 0) {
          console.log("🍽️ Menu items znalezione:", data.meta.menu.length)
          setMenuItems(data.meta.menu.map((item: any) => ({
            id: item.id || item.dish_id || '',
            name: item.name || item.dish_name || '',
            price_pln: Number(item.price_pln || item.price || 0),
            category: item.category || ''
          })))
        } else if (data.context?.last_menu && Array.isArray(data.context.last_menu) && data.context.last_menu.length > 0) {
          console.log("🍽️ Menu items z context:", data.context.last_menu.length)
          setMenuItems(data.context.last_menu.map((item: any) => ({
            id: item.id || item.dish_id || '',
            name: item.name || item.dish_name || '',
            price_pln: Number(item.price_pln || item.price || 0),
            category: item.category || ''
          })))
        } else {
          setMenuItems([])
        }
        
        // NIE ukrywaj odpowiedzi - pozostaje w chat bubbles
        // setTimeout(() => {
        //   console.log("⏰ Czyszczę odpowiedź Amber")
        //   setAmberResponse("")
        // }, 8000)
        
        // Odtwórz audio jeśli jest dostępne
        if (data.audioContent) {
          console.log("🎵 Wywołuję playAudioFromBase64...")
          playAudioFromBase64(data.audioContent)
          console.log("🎵 playAudioFromBase64 wywołane")
        } else {
          console.log("⚠️ Brak audioContent w odpowiedzi")
        }
        // 🔄 Jeśli backend dodał do koszyka po stronie sesji – zsynchronizuj z lokalnym CartContext
        try {
          const meta = (data as any)?.meta
          if (meta?.addedToCart && Array.isArray(meta?.cart?.items)) {
            for (const it of meta.cart.items) {
              const item = {
                id: it.id,
                name: it.name,
                price: Number(it.price_pln ?? it.price ?? 0),
                quantity: Number(it.qty || it.quantity || 1),
              }
              const restaurantData = { id: it.restaurant_id, name: it.restaurant_name }
              addToCart(item as any, restaurantData as any)
            }
            setIsOpen(true)
          }
        } catch (e) {
          console.warn('⚠️ Failed to sync meta.cart to local CartContext:', e)
        }
        // Dodatkowo: jeśli UI myśli, że wciąż nagrywa, wymuś reset
        try {
          // nic — stan recording kontroluje hook; tu tylko safety net do logów
          console.log("🏁 Amber reply received — recording:", recording)
        } catch {}
      } else {
        console.warn("⚠️ Brak reply w odpowiedzi Amber")
      }
    } catch (error) {
      console.error("❌ Błąd komunikacji z Amber:", error)
      const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd'
      console.error("📝 Szczegóły błędu:", errorMsg)
      setAmberResponse(`Błąd: ${errorMsg}`)
      setTimeout(() => setAmberResponse(""), 5000)
    } finally {
      // 🔄 Pozwól na kolejną identyczną komendę
      lastSentTextRef.current = ""
    }
  }, [sessionId, coords.lat, coords.lng])

  // Odtwarzanie audio z base64
  const playAudioFromBase64 = useCallback((base64Audio: string) => {
    // 🔥 Zapobiegnij podwójnemu odtwarzaniu
    if (isPlayingAudio) {
      console.log("⏭️ Audio już jest odtwarzane, pomijam")
      return
    }
    
    try {
      setIsPlayingAudio(true)
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`)
      audio.onended = () => {
        console.log("✅ Audio zakończone")
        setIsPlayingAudio(false)
      }
      audio.onerror = () => {
        console.error("❌ Błąd odtwarzania audio")
        setIsPlayingAudio(false)
      }
      audio.play()
      console.log("🔊 Odtwarzam odpowiedź Amber")
    } catch (error) {
      console.error("❌ Błąd odtwarzania audio:", error)
      setIsPlayingAudio(false)
    }
  }, [isPlayingAudio])

  // Efekt do automatycznego wysyłania transkrypcji do Amber Brain
  useEffect(() => {
    console.log("🔍 useEffect triggered:", { finalText, recording })
    const trimmedFinal = (finalText || '').trim()
    const trimmedVoice = (voiceQuery || '').trim()

    if (!recording && trimmedFinal) {
      // 🔥 Sprawdź czy to nie jest ten sam tekst co ostatnio wysłany
      if (trimmedFinal === lastSentTextRef.current) {
        console.log("⏭️ Ten sam tekst już wysłany, pomijam:", trimmedFinal)
        setFinalText("")
        return
      }
      
      console.log("✅ Finalna transkrypcja (warunek spełniony):", trimmedFinal)
      lastSentTextRef.current = trimmedFinal
      setTimeout(() => { lastSentTextRef.current = "" }, 2000)
      sendToAmberBrain(trimmedFinal)
      // 🔥 Przedłużony czas wyświetlania transkrypcji - wyczyść po 5 sekundach zamiast natychmiast
      setTimeout(() => {
        setFinalText("")
      }, 5000)
      return
    }

      // Fallback: jeśli brak finalText, ale mamy voiceQuery (np. tylko interim), wyślij to
      if (!recording && !trimmedFinal && trimmedVoice) {
        // 🔥 Sprawdź czy to nie jest ten sam tekst co ostatnio wysłany
        if (trimmedVoice === lastSentTextRef.current) {
          console.log("⏭️ Ten sam tekst już wysłany (fallback), pomijam:", trimmedVoice)
          setVoiceQuery("")
          return
        }
        
        console.log("🛟 Fallback → wysyłam voiceQuery:", trimmedVoice)
        lastSentTextRef.current = trimmedVoice
        setTimeout(() => { lastSentTextRef.current = "" }, 2000)
        sendToAmberBrain(trimmedVoice)
        // Przedłużony czas wyświetlania transkrypcji - wyczyść po 5 sekundach
        setTimeout(() => {
          setVoiceQuery("")
        }, 5000)
        return
      }
      
      // Wyczyść userMessage po czasie (opcjonalne, jeśli chcesz)
      // setTimeout(() => setUserMessage(""), 30000) // po 30 sekundach

    if (trimmedFinal && recording) {
      console.log("⏸️ Czekam na zakończenie nagrywania...")
    } else {
      console.log("⏸️ Warunek niespełniony - nie wysyłam:", {
        hasFinalText: !!trimmedFinal,
        hasVoiceQuery: !!trimmedVoice,
        isNotRecording: !recording
      })
    }
  }, [finalText, voiceQuery, recording, sendToAmberBrain])

  return (
    <div className="freeflow">
      {/* Stała warstwa tła wypełniająca okno (object-fit: cover) */}
      <picture>
        <source media="(max-width: 768px)" srcSet="/images/background.png" />
        <img src="/images/desk.png" alt="" className="bg" />
      </picture>
      <Switch onToggle={toggleUI} amberReady={!recording} />
      {/* Header z menu i koszykiem */}
      <header className="top-header">
        <div className="header-left">
          <LogoFreeFlow />
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

      {/* Main wrapper - TYLKO LOGO wyśrodkowane */}
      <div className="main-wrapper">
        <div className="hero-stack">
          <div className="logo-container" onClick={handleLogoClick}>
            <img 
              src="/images/Freeflowlogo.png" 
              alt="FreeFlow" 
              className={`logo ${recording ? 'recording' : ''}`}
              style={{
                filter: recording ? 'drop-shadow(0 0 20px rgba(255, 50, 150, 0.6))' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Kafelki na dole (fixed) - ukrywają się gdy voice panel aktywny lub jest odpowiedź */}
      <div className={`tiles ${(showTextPanel || amberResponse) ? 'hidden' : ''}`}>
        <div className="tile"><img src="/icons/food.png" alt="Jedzenie" /></div>
        <div className="tile"><img src="/icons/car.png" alt="Taxi" /></div>
        <div className="tile"><img src="/icons/hotel.png" alt="Hotel" /></div>
      </div>

      {/* Chat Bubbles - główny UI dla konwersacji */}
      {(userMessage || amberResponse) && (
        <ChatBubbles
          userMessage={userMessage}
          amberResponse={amberResponse}
          restaurants={restaurants}
          menuItems={menuItems}
        />
      )}

      {/* VoicePanelText - dolny środek (włącz gdy panel, odpowiedź lub trwa mówienie) */}
      {(showTextPanel || amberResponse || recording || interimText || finalText) && (
        <VoicePanelText
          amberResponse={amberResponse}
          interimText={interimText as unknown as string}
          finalText={finalText as unknown as string}
          recording={recording}
        />
      )}

      {/* VoiceTextPanel - dolny pasek */}
      <VoiceTextPanel />

      {/* MenuDrawer i Cart */}
      <MenuDrawer />
      <Cart />
    </div>
  )
}