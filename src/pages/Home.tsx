import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUI } from "../state/ui"
// @ts-ignore
import { useCart } from "../state/CartContext"
// @ts-ignore
import Cart from "../components/Cart"
// @ts-ignore
import { useTheme } from '../state/ThemeContext';
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer"
import VoiceCommandCenter from "../components/VoiceCommandCenter"
import ChatBubbles from "../components/ChatBubbles"
import VoiceCommandCenterV2 from '../components/VoiceCommandCenterV2';
import ChatBubblesV2 from '../components/ChatBubblesV2';
import Switch from "../components/Switch"
import LogoFreeFlow from "../components/LogoFreeFlow.jsx"
// @ts-ignore
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"
import "./Home.css"
import { CONFIG, ENABLE_IMMERSIVE_MODE, getApiUrl } from "../lib/config"

export default function Home() {
  const { theme } = useTheme();
  const [showTextPanel, setShowTextPanel] = useState(true);
  const [messages, setMessages] = useState<any[]>([])
  const [immersive, setImmersive] = useState(false)
  const [voiceQuery, setVoiceQuery] = useState("")
  const [amberResponse, setAmberResponse] = useState("")
  const [amberData, setAmberData] = useState<any>(null)
  const [userMessage, setUserMessage] = useState("")
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string; cuisine_type?: string; city?: string }>>([])
  const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string; price_pln: number; category?: string }>>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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
  const lastMessageRef = useRef("")
  const [isSending, setIsSending] = useState(false);

  // 📍 Geolokalizacja użytkownika (opcjonalna)
  // 🇵🇱 FALLBACK: Jeśli geolocation nie działa lub zwraca współrzędne poza Polską, użyj Warszawy
  const WARSAW_COORDS = { lat: 52.2297, lng: 21.0122 };
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>(WARSAW_COORDS);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.log('📍 Geolocation not available, using Warsaw fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Sprawdź czy współrzędne są w Polsce (lat: 49-55, lng: 14-25)
        const isInPoland = latitude >= 49 && latitude <= 55 && longitude >= 14 && longitude <= 25;

        if (isInPoland) {
          console.log('📍 Using real geolocation:', latitude, longitude);
          setCoords({ lat: latitude, lng: longitude });
        } else {
          console.log('📍 Coordinates outside Poland, using Warsaw fallback:', latitude, longitude);
          setCoords(WARSAW_COORDS);
        }
      },
      (error) => {
        console.log('📍 Geolocation error, using Warsaw fallback:', error.message);
        setCoords(WARSAW_COORDS);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );
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
    if (ENABLE_IMMERSIVE_MODE) {
      setImmersive(true)
    }
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
    if (isSending) return
    if (text.trim() === lastMessageRef.current) return
    lastMessageRef.current = text.trim()
    setIsSending(true)
    setUserMessage(text)

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

      const apiUrl = getApiUrl('/api/brain')
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

      setIsProcessing(true)

      console.log("📥 Response status:", response.status, response.statusText)

      if (!response.ok) {
        setIsProcessing(false)
        const errorText = await response.text()
        console.error("❌ Response error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      setIsProcessing(false)
      console.log("🧠 Odpowiedź Amber:", data)
      setAmberData(data)

      // Zapisz wiadomość użytkownika
      // Zapisz wiadomość użytkownika
      // setUserMessage(text) - moved to start of function

      // Pokaż odpowiedź
      if (data.reply) {
        console.log("✅ Ustawiam odpowiedź Amber:", data.reply)
        setAmberResponse(data.reply)

        // 📦 Restaurants & menu (support both new and legacy backend shapes)
        console.log("🔍 Backend response data:", {
          hasLocationRestaurants: !!data.locationRestaurants,
          locationRestaurantsLength: data.locationRestaurants?.length,
          hasRestaurants: !!data.restaurants,
          restaurantsLength: data.restaurants?.length,
          hasContextRestaurants: !!data.context?.last_restaurants_list,
          contextRestaurantsLength: data.context?.last_restaurants_list?.length,
          hasMenuItems: !!data.menuItems,
          hasMenu: !!data.menu,
          hasContextMenu: !!data.context?.last_menu
        });

        const restaurants =
          // preferred: explicit fields from backend (future proof)
          (Array.isArray(data.locationRestaurants) && data.locationRestaurants.length > 0
            ? data.locationRestaurants
            : null) ||
          (Array.isArray(data.restaurants) && data.restaurants.length > 0
            ? data.restaurants
            : null) ||
          // legacy: stored only in session context
          (data.context?.last_restaurants_list &&
            Array.isArray(data.context.last_restaurants_list) &&
            data.context.last_restaurants_list.length > 0
            ? data.context.last_restaurants_list
            : null)

        const menuItems =
          // preferred: explicit menuItems from backend
          (Array.isArray(data.menuItems) && data.menuItems.length > 0
            ? data.menuItems
            : null) ||
          // legacy: stored only in session context
          (data.context?.last_menu &&
            Array.isArray(data.context.last_menu) &&
            data.context.last_menu.length > 0
            ? data.context.last_menu
            : null)

        console.log("✅ Extracted data:", {
          restaurantsCount: restaurants?.length || 0,
          menuItemsCount: menuItems?.length || 0,
          restaurants: restaurants,
          menuItems: menuItems
        });

        setRestaurants(restaurants)
        setMenuItems(menuItems)

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
        } catch { }
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
      setIsSending(false)
      // 🔄 Pozwól na kolejną identyczną komendę
      // lastMessageRef.current = "" // Zostawiamy, żeby nie wysyłać tego samego w pętli
    }
  }, [sessionId, coords.lat, coords.lng, isSending])

  const handleManualSubmit = useCallback(
    (text: string) => {
      const trimmed = (text || "").trim()
      if (!trimmed) return
      console.log("⌨️ Manual submit from VoicePanelText:", trimmed)
      sendToAmberBrain(trimmed)
    },
    [sendToAmberBrain]
  )

  const handleRestaurantSelect = useCallback(
    (restaurant: any) => {
      console.log("🍽️ Restaurant selected:", restaurant)
      // Znajdź indeks restauracji w liście
      const index = restaurants?.findIndex(r => r.id === restaurant.id) ?? -1;
      if (index !== -1) {
        // Wyślij numer (1-based) który backend rozumie
        const number = index + 1;
        console.log(`📍 Sending restaurant number: ${number}`);
        sendToAmberBrain(String(number));
      } else {
        // Fallback - wyślij nazwę
        console.warn("⚠️ Restaurant not found in list, sending name");
        sendToAmberBrain(restaurant.name);
      }
    },
    [sendToAmberBrain, restaurants]
  )

  const handleMenuItemSelect = useCallback(
    (item: any) => {
      console.log("🍕 Menu item selected:", item)
      // Wyślij np. "Dodaj [nazwa dania]"
      sendToAmberBrain(`Dodaj ${item.name}`)
    },
    [sendToAmberBrain]
  )

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
  // ---------------------- FIXED MESSAGE SENDING LOGIC --------------------------
  useEffect(() => {
    const trimmedFinal = finalText?.trim();
    const trimmedVoice = voiceQuery?.trim();

    // 1) If we have final ASR text → send immediately
    if (!recording && trimmedFinal) {
      if (trimmedFinal !== lastMessageRef.current) {
        console.log("📨 Sending FINAL:", trimmedFinal)
        sendToAmberBrain(trimmedFinal);
        // Wyczyść finalText po wysłaniu aby uniknąć ponownego wysyłania
        setFinalText("");
      }
      return;
    }

    // 2) If no final but we have fallback voice text
    if (!recording && !trimmedFinal && trimmedVoice) {
      if (trimmedVoice !== lastMessageRef.current) {
        console.log("📨 Sending VOICE fallback:", trimmedVoice);
        sendToAmberBrain(trimmedVoice);
        // Wyczyść voiceQuery po wysłaniu
        setVoiceQuery("");
      }
    }
  }, [finalText, voiceQuery, recording, sendToAmberBrain, setFinalText]);
  // ---------------------- END FIX ----------------------------------------------

  return (
    <div className={`home-page freeflow ${immersive ? 'immersive' : ''}`}>
      {/* Stała warstwa tła wypełniająca okno (object-fit: cover) */}
      <picture>
        <source media="(max-width: 768px)" srcSet="/images/background.png" />
        <img src="/images/desk.png" alt="" className="bg" />
      </picture>
      {/* Immersive overlay */}
      <AnimatePresence>
        {immersive && ENABLE_IMMERSIVE_MODE && (
          <motion.div
            key="immersive-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.83, 0, 0.17, 1] }}
            className="immersive-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.73)",
              backdropFilter: "blur(28px) saturate(140%)",
              WebkitBackdropFilter: "blur(28px) saturate(140%)",
              zIndex: 20,
              pointerEvents: "none"
            }}
          />
        )}
      </AnimatePresence>
      <Switch onToggle={toggleUI} amberReady={!recording} initial={true} />
      {/* Header z menu i koszykiem */}
      <header className="top-header">
        <div className="header-left">
          <LogoFreeFlow />
          <p>Voice to order — Złóż zamówienie<br />Restauracja, taxi albo hotel?</p>
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

      {/* Kafelki na dole (fixed) - widoczne tylko gdy panel schowany */}
      <div className={`tiles ${(showTextPanel || immersive) ? 'hidden' : ''}`}>
        <div className="tile"><img src="/icons/food.png" alt="Jedzenie" /></div>
        <div className="tile"><img src="/icons/car.png" alt="Taxi" /></div>
        <div className="tile"><img src="/icons/hotel.png" alt="Hotel" /></div>
      </div>

      {/* Chat wrapper - ogranicza szerokość i dodaje bezpieczne paddingi */}
      <div className="chat-wrapper">
        {/* Chat Bubbles Area */}
        {theme === 'v2' ? (
          <ChatBubblesV2
            userMessage={userMessage}
            amberResponse={amberResponse}
            restaurants={restaurants}
            menuItems={menuItems}
            onRestaurantSelect={handleRestaurantSelect}
            onMenuItemSelect={handleMenuItemSelect}
          />
        ) : (
          <ChatBubbles
            userMessage={userMessage}
            amberResponse={amberResponse}
            restaurants={restaurants}
            menuItems={menuItems}
            onRestaurantSelect={handleRestaurantSelect}
            onMenuItemSelect={handleMenuItemSelect}
          />
        )}

        {/* Voice Command Center */}
        {theme === 'v2' ? (
          <VoiceCommandCenterV2
            recording={recording}
            isProcessing={isSending}
            isSpeaking={isPlayingAudio}
            interimText={interimText}
            finalText={finalText || voiceQuery}
            onMicClick={handleLogoClick}
            onTextSubmit={handleManualSubmit}
          />
        ) : (
          <VoiceCommandCenter
            recording={recording}
            isProcessing={isSending}
            isSpeaking={isPlayingAudio}
            interimText={interimText}
            finalText={finalText || voiceQuery}
            onMicClick={handleLogoClick}
            onSubmitText={handleManualSubmit}
            visible={showTextPanel}
          />
        )}
      </div>


      {/* MenuDrawer i Cart */}
      <MenuDrawer />
      <Cart />
    </div>
  )
}