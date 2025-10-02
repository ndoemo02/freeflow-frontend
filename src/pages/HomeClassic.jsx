// src/pages/HomeClassic.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { speakTts } from "../lib/ttsClient";
import { recordOnce } from '../lib/mic';
import { addToCart, total, getCart, clearCart } from '../lib/cart';
import ResultsList from "../components/ResultsList";
import { manageTurn } from "../lib/DialogManager";

export default function HomeClassic() {
  const [hits, setHits] = useState([]);
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState([]);
  const [dialogSlots, setDialogSlots] = useState({});
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [showRestaurants, setShowRestaurants] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const lastSpeakPromiseRef = useRef(Promise.resolve());
  const silenceTimerRef = useRef(null);
  const hardStopTimerRef = useRef(null);
  const greetedRef = useRef(false);
  const streamCancelRef = useRef(0);

  // NOWE: akumulator finalText w trakcie sesji SR (eliminuje problem „zamrożonego” stanu w closure)
  const finalStrRef = useRef("");

  // Konfiguracja czasów nagrywania - BARDZIEJ CZUŁE
  const SILENCE_MS = 1200;      // po ilu ms ciszy zatrzymujemy SR (było 2200)
  const MAX_RECORDING_MS = 8000; // twardy limit jednej sesji (było 14000)

  // Ping backendu
    useEffect(() => {
    (async () => {
      try {
        const h = await api('/api/health');
        if (!h?.ok) console.warn('Health not ok', h);
      } catch (e) {
        console.warn('Health check failed:', e);
      }
    })();
  }, []);

  // Jednorazowe powitanie - tylko po pierwszej interakcji użytkownika
  useEffect(() => {
    if (!greetedRef.current) {
      greetedRef.current = true;
      // Usuń automatyczne powitanie - TTS wymaga interakcji użytkownika
      // setTimeout(() => {
      //   lastSpeakPromiseRef.current = lastSpeakPromiseRef.current.then(() =>
      //     speakNow("Witaj we Freeflow, z nami zamówisz pewnie i szybko")
      //   );
      // }, 300);
    }
  }, []);

  // Inicjalizacja Web Speech API
    useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "pl-PL";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimStr = "";
      let finalStr = finalStrRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t = res[0].transcript;
        if (res.isFinal) {
          finalStr += (finalStr ? " " : "") + t.trim();
        } else {
          interimStr += t;
        }
      }

      finalStrRef.current = finalStr;
      setInterim(interimStr);
      setFinalText(finalStr);

      const merged = (finalStr + " " + interimStr).trim();
      setQuery(merged);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {}
      }, SILENCE_MS);
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      finalStrRef.current = "";
      setFinalText("");
      setInterim("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (hardStopTimerRef.current) clearTimeout(hardStopTimerRef.current);
      recognitionRef.current = null;
    };
  }, []);

  // TTS: jeden punkt wejścia, z deduplikacją i cache po stronie klienta
  const speakNow = async (text) => {
    try {
      speakingRef.current = true;
      setSpeaking(true);
      await speakTts(text, { lang: "pl-PL", voice: "pl-PL-Wavenet-D" });
    } catch (e) {
      console.warn("TTS failed", e);
    } finally {
      speakingRef.current = false;
      setSpeaking(false);
    }
  };

  // Zapisz zamówienie do bazy danych z timeout
  const saveOrderToDatabase = async (cartItems, restaurantId) => {
    try {
      console.log("💾 Saving order to database:", { cartItems, restaurantId });
      
      // Timeout po 5 sekundach
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantId || 'default-restaurant',
          items: cartItems,
          total: total(),
          customerId: 'anonymous'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Order saved:", result);
      
      // Wyczyść koszyk po zapisaniu
      clearCart();
      
      return result;
    } catch (error) {
      console.error("❌ Failed to save order:", error);
      // Nie rzucaj błędu - pozwól systemowi działać
      console.log("⚠️ Continuing without saving to database");
      return { error: true };
    }
  };

  // Pokaż popup koszyka na 2.5 sekundy
  const showCartPopupTemporary = () => {
    setShowCartPopup(true);
    setTimeout(() => {
      setShowCartPopup(false);
    }, 2500);
  };

  // Załaduj menu restauracji
  const loadRestaurantMenu = async (restaurantId) => {
    try {
      console.log("🍽️ Loading menu for restaurant:", restaurantId);
      const response = await fetch(`/api/menu?restaurant_id=${restaurantId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log("📋 Menu loaded:", data);
      
      if (data.results && data.results.length > 0) {
        setMenuItems(data.results);
        setShowMenu(true);
        return data.results;
      } else {
        console.log("⚠️ No menu items found");
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to load menu:", error);
      return [];
    }
  };

  // Załaduj restauracje w okolicy
  const loadNearbyRestaurants = async (query = "") => {
    try {
      console.log("🏪 Loading nearby restaurants:", query);
      const response = await fetch(`/api/restaurants?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log("🏪 Restaurants loaded:", data);
      
      if (data.results && data.results.length > 0) {
        setRestaurants(data.results);
        setShowRestaurants(true);
        return data.results;
      } else {
        console.log("⚠️ No restaurants found");
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to load restaurants:", error);
      return [];
    }
  };

  const speak = (text) => {
    lastSpeakPromiseRef.current = lastSpeakPromiseRef.current
      .catch(() => {})
      .then(() => speakNow(text));
    return lastSpeakPromiseRef.current;
  };

  // Nagrywanie audio i wysyłanie do STT
  const handleMicOnce = async () => {
    try {
      setSpeaking(false); // na pewność
      const blob = await recordOnce({ seconds: 5 });
      const buf = await blob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

      const resp = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioContent: b64, mimeType: blob.type || 'audio/webm' }),
      });

      if (!resp.ok) throw new Error(`STT HTTP ${resp.status}`);
      const data = await resp.json().catch(() => ({}));
      const text = (data?.transcript || '').trim();
      if (!text) return;

      setQuery(text);       // wstaw do inputu
      await runQueryPipeline(text); // uruchom asystenta
    } catch (e) {
      console.warn('STT failed', e);
    }
  };

  // Typowanie „strumieniowe” odpowiedzi asystenta (UI)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const streamAssistant = async (text) => {
    const id = Date.now();
    streamCancelRef.current = id;
    setChat((prev) => [...prev, { id, role: "assistant", text: "" }]);
    const words = (text || "").split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      if (streamCancelRef.current !== id) return;
      const w = words[i];
      setAssistantText((prev) => (prev ? prev + " " : "") + w);
      setChat((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: m.text ? m.text + " " + w : w } : m))
      );
      await sleep(40);
    }
  };

  // Body classes (stany UI)
    useEffect(() => {
    document.body.classList.toggle("is-listening", recording);
  }, [recording]);
    useEffect(() => {
    document.body.classList.toggle("is-speaking", speaking);
  }, [speaking]);

  // Klik / Enter / Spacja na logo – nagrywanie audio i STT
  const handleMicClick = () => {
    if (processingRef.current || speakingRef.current) return;
    handleMicOnce();
  };

  const handleLogoKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleMicClick();
    }
  };

  // Pipeline zapytania (DialogManager)
  const runQueryPipeline = async (q) => {
    const trimmed = (q || "").trim();
    if (!trimmed) return;
    if (processingRef.current) {
      console.log("⚠️ Already processing, ignoring:", trimmed);
      return;
    }
    processingRef.current = true;
    setLoading(true);
    setError("");

    try {
      setChat((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), role: "user", text: trimmed },
      ]);

      setFinalText("");
      setInterim("");

      const resp = await manageTurn(trimmed, dialogSlots);
      setDialogSlots(resp.slots || {});

      if (resp.speech) {
        await streamAssistant(resp.speech);
        await speak(resp.speech);
      }

      if (resp.action === "search_restaurants") {
        console.log("Restaurants found:", resp.slots);
        // Załaduj menu po wybraniu restauracji
        if (resp.slots.restaurantId) {
          await loadRestaurantMenu(resp.slots.restaurantId);
        }
      } else if (resp.action === "search_menu") {
        console.log("Menu search triggered:", resp.slots);
        // Załaduj menu po wyszukaniu pozycji menu
        if (resp.slots.restaurantId) {
          await loadRestaurantMenu(resp.slots.restaurantId);
        }
      } else if (resp.action === "search_restaurants_general") {
        console.log("General restaurant search:", resp.slots);
        // Załaduj restauracje w okolicy
        await loadNearbyRestaurants(trimmed);
      } else if (resp.action === "add_to_cart") {
        console.log("Added to cart:", resp.slots);
        // Dodaj do koszyka
        if (resp.slots.menuItemId && resp.slots.quantity && resp.slots.price) {
          addToCart({
            id: resp.slots.menuItemId,
            name: resp.slots.menuItem || 'Pozycja',
            qty: resp.slots.quantity,
            price: resp.slots.price,
          });
        }
        await speak("Dodałem do koszyka! Finalizuję zamówienie...");
        
        // NATYCHMIASTOWE finalizowanie - bez opóźnienia!
        const cart = getCart();
        console.log("🚀 Immediate checkout after add to cart, cart:", cart);
        if (cart.length > 0) {
          // Pokaż popup koszyka
          showCartPopupTemporary();
          
          await speak("Finalizuję zamówienie...");
          
          // Zapisz w tle - nie czekaj
          saveOrderToDatabase(cart, resp.slots.restaurantId).catch(err => 
            console.log("⚠️ Background save failed:", err)
          );
          
          await speak("Przekierowuję do panelu zamówień...");
          window.location.href = "/panel/customer";
        }
      } else if (resp.action === "checkout") {
        console.log("Checkout action triggered:", resp.slots);
        await speak("Finalizuję zamówienie...");
        // Dodaj do koszyka przed przekierowaniem
        if (resp.slots.menuItemId && resp.slots.quantity && resp.slots.price) {
          addToCart({
            id: resp.slots.menuItemId,
            name: resp.slots.menuItem || 'Pozycja',
            qty: resp.slots.quantity,
            price: resp.slots.price,
          });
        }
        await speak("Przekierowuję do panelu zamówień...");
        window.location.href = "/panel/customer";
        return;
      } else if (resp.readyToConfirm && getCart().length > 0) {
        // Natychmiastowe finalizowanie gdy użytkownik potwierdza
        console.log("🚀 Immediate checkout triggered, cart:", getCart());
        await speak("Finalizuję zamówienie natychmiast...");
        window.location.href = "/panel/customer";
        return;
      } else if (resp.action === "taxi_order") {
        console.log("Taxi order triggered:", resp.slots);
        await speak(`Zamawiam taxi z ${resp.slots.pickupAddress} do ${resp.slots.destinationAddress}. Szacowana cena: ${resp.slots.estimatedPrice} zł.`);
        await speak("Przekierowuję do panelu taxi...");
        window.location.href = "/panel/taxi";
        return;
      }

      if (resp.readyToConfirm) {
        const term = resp.slots?.item || trimmed;
        try {
          console.log('🔎 /api/places?q=', term);
          const res = await api(`/api/places?q=${encodeURIComponent(term)}`);
          const list = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
          setHits(list);
        } catch (e) {
          console.warn('Places search failed:', e);
          setError('Nie udało się wyszukać miejsc. Spróbuj ponownie.');
        }
      }
    } catch (e) {
      setError(e?.message || "Błąd");
    } finally {
      setLoading(false);
      // Dodaj małe opóźnienie przed resetowaniem processingRef
      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    }
  };

  // Po zakończeniu nagrywania – uruchom pipeline
    useEffect(() => {
    if (!recording && query.trim()) {
      runQueryPipeline(query);
    }
  }, [recording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Renderuj przyciski koszyka gdy mamy item+qty+price
  function renderOrderCta() {
    if (!dialogSlots.menuItemId || !dialogSlots.quantity || !dialogSlots.price) return null;

    const onAdd = () => {
      addToCart({
        id: dialogSlots.menuItemId,
        name: dialogSlots.menuItem || 'Pozycja',
        qty: dialogSlots.quantity,
        price: dialogSlots.price,
      });
      speakTts(`Dodałem do koszyka. Razem ${total()} zł`, { lang: 'pl-PL' }).catch(() => {});
    };

    const onCheckout = async () => {
      try {
        const resp = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: dialogSlots.restaurantId,
            items: getCart(),
          }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        clearCart();
        speakTts('Zamówienie złożone. Dziękuję!', { lang: 'pl-PL' }).catch(() => {});
      } catch (e) {
        console.warn('Checkout failed', e);
      }
    };

    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onAdd}>Dodaj do koszyka</button>
        <button onClick={onCheckout}>Zamów</button>
        <div style={{ marginLeft: 'auto' }}>Suma: {total().toFixed(2)} zł</div>
      </div>
    );
  }

  return (
    <section className="ff-hero min-h-[82vh] sm:min-h-[76vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Layout: menu po lewej + główna zawartość */}
      <div className="ff-main-layout relative z-10">
        {/* Menu po lewej stronie */}
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              className="ff-menu-sidebar"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="ff-menu-header backdrop-blur-xl bg-gradient-to-r from-brand-500/20 to-purple-500/20 border-b border-white/10 p-4 rounded-t-2xl">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🍽️
                  </motion.span>
                  Menu
                </h3>
                <button 
                  className="ff-menu-close absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-all hover:scale-110"
                  onClick={() => setShowMenu(false)}
                  aria-label="Zamknij menu"
                >
                  ✕
                </button>
              </div>
              <div className="ff-menu-items p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {menuItems.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="ff-menu-item group cursor-pointer rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-4 hover:border-brand-500/50 transition-all hover:shadow-lg hover:shadow-brand-500/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const itemName = item.name.toLowerCase();
                      speak(`Dodaję ${item.name} do koszyka`);
                      runQueryPipeline(itemName);
                    }}
                  >
                    <div className="ff-menu-item-name text-white font-semibold group-hover:text-brand-400 transition-colors">{item.name}</div>
                    <div className="ff-menu-item-price text-brand-500 font-bold text-lg mt-1">{item.price.toFixed(2)} zł</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Główna zawartość */}
        <div className="ff-main-content pb-14 sm:pb-12">
          {/* Stos: logo + szukajka */}
          <div className="ff-stack pt-12 sm:pt-16">
            <motion.div
              className="ff-logo-wrap flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="relative"
                animate={recording ? {
                  scale: [1, 1.05, 1],
                } : speaking ? {
                  scale: [1, 1.02, 1],
                } : {}}
                transition={recording ? {
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : speaking ? {
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
            {/* Animated glow rings */}
            {recording && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-brand-500/50"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-purple-500/50"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: "easeOut" }}
                />
              </>
            )}
            
            {/* Logo with shadow */}
            <motion.img
              className={`ff-logo cursor-pointer relative z-10 ${recording ? "is-listening" : ""}`}
              src="/images/Freeflowlogo.png"
              alt="FreeFlow logo"
              role="button"
              tabIndex={0}
              aria-pressed={recording}
              aria-label="Naciśnij, aby mówić"
              onClick={handleMicClick}
              onKeyDown={handleLogoKeyDown}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                filter: recording 
                  ? "drop-shadow(0 0 30px rgba(255, 106, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 106, 0, 0.4))"
                  : speaking
                  ? "drop-shadow(0 0 20px rgba(139, 92, 246, 0.6))"
                  : "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))"
              }}
            />
          </motion.div>
        </motion.div>

        <motion.form
          className="ff-search relative"
          onSubmit={(e) => {
            e.preventDefault();
            runQueryPipeline(query);
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 hover:border-brand-500/30 transition-all">
            <input
              className="ff-input flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder-gray-400"
              placeholder="Powiedz lub wpisz..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  console.log("🚀 Enter pressed, calling runQueryPipeline with:", query);
                  runQueryPipeline(query);
                }
              }}
            />
            <motion.button
              className={`ff-btn ff-btn--circle w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                recording 
                  ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50" 
                  : "bg-gradient-to-br from-brand-500 to-brand-600 hover:shadow-lg hover:shadow-brand-500/50"
              }`}
              type="button"
              aria-label="Mów"
              onClick={handleMicClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={recording ? { 
                boxShadow: [
                  "0 0 20px rgba(239, 68, 68, 0.5)",
                  "0 0 40px rgba(239, 68, 68, 0.8)",
                  "0 0 20px rgba(239, 68, 68, 0.5)"
                ]
              } : {}}
              transition={{ duration: 1, repeat: recording ? Infinity : 0 }}
            >
              <motion.span 
                aria-hidden="true"
                animate={recording ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: recording ? Infinity : 0 }}
              >
                {recording ? "🛑" : "🎙️"}
              </motion.span>
            </motion.button>
          </div>
          
          {/* Voice indicator */}
          <AnimatePresence>
            {recording && (
              <motion.div
                className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 text-sm text-brand-400 flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  🔴
                </motion.span>
                Słucham...
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>

      {/* Chat bubbles */}
      <AnimatePresence>
        {!!chat.length && (
          <motion.div 
            className="ff-chat mt-6 space-y-4"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {chat.map((m, index) => (
              <motion.div
                key={m.id}
                className={[
                  "ff-bubble px-6 py-4 rounded-2xl backdrop-blur-xl border max-w-2xl",
                  m.role === "assistant" 
                    ? "ff-bubble--assistant bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 text-white mr-auto" 
                    : "ff-bubble--user bg-gradient-to-br from-brand-500/20 to-brand-600/10 border-brand-500/30 text-white ml-auto"
                ].join(" ")}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {m.text}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Popup koszyka - pokazuje się na 2.5s */}
      <AnimatePresence>
        {showCartPopup && (
          <motion.div 
            className="fixed top-8 right-8 z-50"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-2xl shadow-green-500/20">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="ff-cart-popup-icon text-4xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  🛒
                </motion.div>
                <div className="ff-cart-popup-text">
                  <div className="ff-cart-popup-title text-white font-bold text-lg">Dodano do koszyka!</div>
                  <div className="ff-cart-popup-details text-green-300 text-sm">
                    {getCart().length} pozycji - {total().toFixed(2)} zł
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Przyciski koszyka */}
      {renderOrderCta()}

      {/* Wyniki */}
          {error && <div className="ff-error" role="status">{error}</div>}
          {loading && <div className="ff-loading" role="status">Szukam...</div>}
          {!!hits.length && <ResultsList results={hits} />}
        </div>

        {/* Restauracje po prawej stronie */}
        <AnimatePresence>
          {showRestaurants && (
            <motion.div 
              className="ff-restaurants-sidebar"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="ff-restaurants-header backdrop-blur-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-white/10 p-4 rounded-t-2xl">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🏪
                  </motion.span>
                  Restauracje w okolicy
                </h3>
                <button 
                  className="ff-restaurants-close absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-all hover:scale-110"
                  onClick={() => setShowRestaurants(false)}
                  aria-label="Zamknij listę restauracji"
                >
                  ✕
                </button>
              </div>
              <div className="ff-restaurants-list p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {restaurants.map((restaurant, index) => (
                  <motion.div 
                    key={restaurant.id} 
                    className="ff-restaurant-item group cursor-pointer rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-4 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      setDialogSlots(prev => ({ ...prev, restaurantId: restaurant.id, restaurant: restaurant.name }));
                      await loadRestaurantMenu(restaurant.id);
                      setShowRestaurants(false);
                      speak(`Wybrałeś ${restaurant.name}. Ładuję menu...`);
                    }}
                  >
                    <div className="ff-restaurant-name text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors">{restaurant.name}</div>
                    <div className="ff-restaurant-type text-gray-400 text-sm mt-1">{restaurant.type || 'Restauracja'}</div>
                    <div className="ff-restaurant-rating text-yellow-400 text-sm mt-2 flex items-center gap-1">
                      {restaurant.rating ? `⭐ ${restaurant.rating}` : '⭐ 4.5'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
