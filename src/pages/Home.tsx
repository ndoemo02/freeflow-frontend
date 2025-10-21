/* eslint-disable jsx-a11y/alt-text */
// --- SAFE JSON (1x parse) ---
function safeParseJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

// --- AUTO SPEAK toggle ---
const AMBER_AUTO_SPEAK = true; // ustaw na false, jeśli chcesz szybko wyłączyć

// --- AUDIO UNLOCK ---
function unlockAudio() {
  const a = new Audio();
  a.play().catch(() => {});
}

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer";
import MenuView from "./MenuView";
import VoiceTextBox from "../components/VoiceTextBox";
import AmberStatus from "../components/AmberStatus";
import TTSSwitcher from "../components/TTSSwitcher";
import LoadingScreen from "../components/LoadingScreen";
// @ts-ignore
import AmberAvatar from "../components/AmberAvatar";
// Removed alternative DrawerMenu; we keep only glassmorphism MenuDrawer
import { VoiceBar } from "../components/VoiceBar";
import { DynamicPopups } from "../components/DynamicPopups";
import { useUI } from "../state/ui";
import { useCart } from "../state/CartContext";
import Cart from "../components/Cart";
import { getApiUrl } from "../lib/config";
import "./Home.css";

export default function Home() {
  const openDrawer = useUI((s) => s.openDrawer);
  const { addToCart, setIsOpen } = useCart();
  const [isRecording, setIsRecording] = useState(false);
  
  // 📍 Geolokalizacja użytkownika
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('📍 User location obtained:', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn('⚠️ Geolocation error:', error.message);
          // Użyj domyślnej lokalizacji (Piekary Śląskie)
          setUserLocation({ lat: 50.386, lng: 18.946 });
        }
      );
    } else {
      console.warn('⚠️ Geolocation not supported, using default location');
      setUserLocation({ lat: 50.386, lng: 18.946 });
    }
  }, []);

  // Debug: loguj zmiany isRecording
  useEffect(() => {
    console.log('🎙️ isRecording changed:', isRecording);
    
    // Auto-reset isRecording po 30 sekundach (safety net)
    if (isRecording) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Auto-resetting isRecording after 30s timeout');
        setIsRecording(false);
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [isRecording]);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("pl-PL-Standard-A");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsMode, setTtsMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ttsMode") || "classic";
    }
    return "classic";
  });
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; price: number; category: string; }[]>([]);
  const [currentAction, setCurrentAction] = useState("");
  const [amberState, setAmberState] = useState<'ready' | 'thinking' | 'error' | 'idle'>('ready');
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Sprawdź czy użytkownik wraca z panelu - pomiń animację
  useEffect(() => {
    const skipIntro = sessionStorage.getItem('skipIntro') === 'true';
    console.log('🏠 Home useEffect - skipIntro:', skipIntro);
    if (skipIntro) {
      // Wyczyść flagę od razu jeśli użytkownik wraca z panelu
      sessionStorage.removeItem('skipIntro');
      console.log('🏠 Home - pomijam animację, flaga wyczyszczona');
      setShowLoadingScreen(false);
    } else {
      console.log('🏠 Home - pokazuję animację');
    }
  }, []);
  const [dynamicMessages, setDynamicMessages] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Funkcja testowa
  const testAmberResponse = () => {
    addDynamicMessage({
      text: 'Chciałbym zamówić w pizzerii Monte Carlo',
      sender: 'Ty',
      icon: '👤',
      type: 'user'
    });
    
    setTimeout(() => {
      addDynamicMessage({
        text: 'Chcesz zobaczyć miejsca, gdzie zamówisz pizzę? Powiedz "pokaż restauracje" lub podaj konkretną nazwę.',
        sender: 'Amber',
        icon: '🤖',
        type: 'info'
      });
    }, 2000);
  };

  // Funkcja do dodawania dynamicznych wiadomości
  const addDynamicMessage = (message: any) => {
    const newMessage = {
      id: Date.now(),
      ...message,
      timestamp: new Date()
    };
    setDynamicMessages(prev => [...prev, newMessage]);
    
    // Auto-usuwanie po 5 sekundach
    setTimeout(() => {
      setDynamicMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 5000);
  };
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Załaduj ustawienia z localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('freeflow-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSelectedVoice(settings.voice || "pl-PL-Standard-A");
      }
    };

    loadSettings();

    // Nasłuchuj zmian ustawień
    const handleSettingsChange = (event: any) => {
      setSelectedVoice(event.detail.voice || "pl-PL-Standard-A");
    };

    window.addEventListener('freeflow-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('freeflow-settings-changed', handleSettingsChange);
  }, []);

  // Wykrywanie rozmiaru ekranu
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleTTSModeChange = (mode: string) => {
    setTtsMode(mode);
    console.log(`🎧 TTS mode changed to: ${mode}`);
  };

  const handleOptionClick = (option: string) => {
    console.log(`Wybrano: ${option}`);
    // Wysyłaj opcję do Dialogflow
    handleVoiceProcess(option);
  };

  const handleRestaurantSelect = async (restaurant: any) => {
    const message = `wybieram ${restaurant.name}`;
    console.log(`Restaurant selected, sending to Dialogflow: "${message}"`);

    // Pokaż wskaźnik ładowania
    setIsProcessing(true);
    try {
      // Wywołaj główną funkcję przetwarzającą, która komunikuje się z Dialogflow
      await handleVoiceProcess(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadMenu = async (restaurantId: string) => {
    try {
      console.log('🍽️ Loading menu for restaurant:', restaurantId);
      const res = await fetch(getApiUrl(`/api/menu?restaurant_id=${restaurantId}`), { method: 'GET' });
      const bodyStr = await res.text();
      const data = safeParseJson(bodyStr);
      console.log('📋 Menu data:', data);
      
      if (data && data.menu && Array.isArray(data.menu)) {
        setMenuItems(data.menu);
      } else {
        // Fallback - przykładowe menu
        const mockMenu = [
          { id: '1', name: 'Pizza Margherita', price: 25.99, category: 'Pizza' },
          { id: '2', name: 'Pizza Pepperoni', price: 28.99, category: 'Pizza' },
          { id: '3', name: 'Spaghetti Carbonara', price: 22.99, category: 'Pasta' },
          { id: '4', name: 'Schabowy z ziemniakami', price: 18.99, category: 'Dania główne' },
          { id: '5', name: 'Zupa pomidorowa', price: 8.99, category: 'Zupy' }
        ];
        setMenuItems(mockMenu);
      }
    } catch (err) {
      console.error('❌ Error loading menu:', err);
      // Fallback - przykładowe menu
      const mockMenu = [
        { id: '1', name: 'Pizza Margherita', price: 25.99, category: 'Pizza' },
        { id: '2', name: 'Pizza Pepperoni', price: 28.99, category: 'Pizza' },
        { id: '3', name: 'Spaghetti Carbonara', price: 22.99, category: 'Pasta' },
        { id: '4', name: 'Schabowy z ziemniakami', price: 18.99, category: 'Dania główne' },
        { id: '5', name: 'Zupa pomidorowa', price: 8.99, category: 'Zupy' }
      ];
      setMenuItems(mockMenu);
    }
  };


  const handleAddToCart = (item: any) => {
    console.log('🛒 Adding to cart:', item);
    const message = `dodaj do koszyka ${item.name}`;
    handleVoiceProcess(message);
  };

  const clearResults = () => {
    setTranscript("");
    setResponse("");
    setRestaurants([]);
    setMenuItems([]);
    setCurrentAction("");
  };
  const startRecording = async () => {
    // Odblokuj audio na pierwszym kliknięciu
    unlockAudio();
    
    setIsRecording(true);
    setError("");
    setTranscript("Nasłuchuję...");
    
    try {
      // Sprawdź tryb TTS
      if (ttsMode === 'live') {
        console.log('🔴 Starting live mic stream...');
        await startLiveMicStream();
      } else {
        // Standardowy tryb
        console.log('🎧 Starting standard recording...');
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          startWebSpeechRecognition();
        } else {
          // Fallback na Google STT
          await startGoogleSTT();
        }
      }
    } catch (err) {
      console.error('Recording error:', err);
      setError('Błąd nagrywania. Sprawdź mikrofon.');
      setIsRecording(false);
    }
  };

  const startWebSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pl-PL';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        handleVoiceProcess(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setError('Błąd rozpoznawania mowy. Próbuję Google STT...');
      startGoogleSTT();
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startGoogleSTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendToGoogleSTT(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      // Auto-stop po 5 sekundach
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
      
    } catch (err) {
      setError('Nie można uzyskać dostępu do mikrofonu');
      setIsRecording(false);
    }
  };

  const sendToGoogleSTT = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // TODO: Endpoint do Google STT w backend
      const res = await fetch(getApiUrl('/api/stt'), {
        method: 'POST',
        body: formData,
      });
      
      const bodyStr = await res.text();
      const response = safeParseJson(bodyStr);
      
      if (response && response.transcript) {
        setTranscript(response.transcript);
        handleVoiceProcess(response.transcript);
      } else {
        setError('Nie udało się rozpoznać mowy');
      }
    } catch (err) {
      setError('Błąd Google STT');
    } finally {
      setIsRecording(false);
    }
  };

  const handleTextInputSubmit = async (text: string) => {
    if (!text.trim()) return;
    await handleVoiceProcess(text);
    setTranscript(""); // Wyczyść pole po wysłaniu (tylko aktualny tekst, historia zostaje)
  };

  const handleVoiceProcess = async (text: string) => {
    setIsProcessing(true);
    setAmberState('thinking');
    try {
      setTranscript(text);
      setError("");
      setResponse("");
      setRestaurants([]);
      setMenuItems([]);
      
      // Dodaj dynamiczną wiadomość użytkownika
      addDynamicMessage({
        text: text,
        sender: 'Ty',
        icon: '👤',
        type: 'user'
      });
      
      setCurrentAction("");
      console.log('🎯 Sending to FreeFlow Brain:', text);
      
      // Wyślij do FreeFlow Brain
      const res = await fetch(getApiUrl('/api/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          lat: userLocation?.lat || 50.386,
          lng: userLocation?.lng || 18.946, // Użyj lokalizacji użytkownika lub domyślnej (Piekary Śląskie)
          ttsMode, // Dodaj tryb TTS
        }),
      });

      // ✅ parsujemy body TYLKO RAZ
      const bodyStr = await res.text();
      const data = safeParseJson(bodyStr);

      if (!data) {
        console.warn('⚠️ Brain returned non-JSON:', bodyStr);
        // możesz opcjonalnie wypowiedzieć błąd:
        // if (AMBER_AUTO_SPEAK) await playTTS('Mam błąd odpowiedzi z serwera.');
        return;
      }

      console.log('🧠 FreeFlow Brain response:', data);
      console.log('   - intent:', data.intent);

      // 🎯 NOWY FLOW: confirm_order - dodaj do koszyka po potwierdzeniu
      if (data.intent === 'confirm_order' && data.parsed_order && data.parsed_order.items && data.parsed_order.restaurant) {
        console.log('✅ confirm_order detected - adding to cart:', data.parsed_order);
        console.log('   - items count:', data.parsed_order.items.length);
        console.log('   - items:', data.parsed_order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', '));

        try {
          // Dodaj każdą pozycję do koszyka
          for (const item of data.parsed_order.items) {
            console.log(`   - Adding item to cart: ${item.quantity}x ${item.name} (id: ${item.menuItemId || item.id})`);
            addToCart({
              id: item.menuItemId || item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity || 1
            }, data.parsed_order.restaurant);
          }

          console.log('✅ Order confirmed and added to cart successfully');
          
          // Automatycznie otwórz koszyk po dodaniu
          setIsOpen(true);
        } catch (error) {
          console.error('❌ Error adding confirmed order to cart:', error);
        }
      }
      // 📝 create_order - tylko pokaż co zostanie zamówione (czeka na potwierdzenie)
      else if (data.intent === 'create_order') {
        console.log('📝 create_order detected - waiting for confirmation');
        console.log('   - Backend is waiting for user to say "tak", "dodaj", etc.');
      }

      if (data.reply || data.response) {
        const responseText = data.reply || data.response;
        setResponse(responseText);
        setAmberState('ready');
        
        // Dodaj dynamiczną wiadomość
        addDynamicMessage({
          text: responseText,
          sender: 'Amber',
          icon: '🤖',
          type: 'info'
        });


        // 1. Sprawdź czy odpowiedź zawiera custom_payload z menu
        if (data.customPayload && data.customPayload.menu_items) {
          console.log('📄 Received custom_payload with menu items:', data.customPayload.menu_items);
          // 2. Ustaw menu_items w stanie i akcję na 'menu'
          setMenuItems(data.customPayload.menu_items);
          setCurrentAction('menu');
        }
        // } else if (data.action === 'show_restaurants' || text.toLowerCase().includes('restauracje')) {
        //   // Jeśli nie ma menu, ale akcja to pokazanie restauracji
        //   // setCurrentAction('restaurants'); // Pokaż listę restauracji
        //   // await loadRestaurants(); // Załaduj dane restauracji
        // }

        // 🔊 auto-mowa (1 linia)
        if (AMBER_AUTO_SPEAK && responseText) {
          console.log('🔊 Auto-speaking:', responseText);
          try {
            await playTTS(responseText);
            console.log('✅ TTS played successfully');
          } catch (error) {
            console.error('❌ Auto-TTS failed:', error);
          }
        }
      } else {
        setError('Brak odpowiedzi od Dialogflow');
      }
    } catch (err) {
      console.error('❌ Voice process error:', err);
      setError(`Błąd przetwarzania głosu: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
      setAmberState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      console.log('🍽️ Loading restaurants...');
      const res = await fetch(getApiUrl('/api/restaurants'), { method: 'GET' });
      const bodyStr = await res.text();
      const data = safeParseJson(bodyStr);
      console.log('🏪 Restaurants data:', data);
      
      if (data && data.restaurants && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants);
      } else {
        // Don't show mock restaurants - keep empty
        setRestaurants([]);
      }
    } catch (err) {
      console.error('❌ Error loading restaurants:', err);
      // Don't show mock restaurants - keep empty
      setRestaurants([]);
    }
  };

  const playTTS = async (text: string) => {
    try {
      console.log('🔊 Playing TTS for:', text);
      console.log('🎧 TTS Mode:', ttsMode);
      console.log('🎧 AMBER_AUTO_SPEAK:', AMBER_AUTO_SPEAK);

      // Wybierz endpoint w zależności od trybu
      const endpoint = ttsMode === "chirp" ? "/api/tts-chirp-hd" : "/api/tts";
      console.log(`🎙️ TTS mode: ${ttsMode} → ${endpoint}`);
      console.log('🌐 Using endpoint:', endpoint);

      // Na razie używamy standardowego TTS dla obu trybów
      // (WebSocket streaming będzie dodany później)

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tone: 'swobodny' // Oba tryby używają tego samego tonu
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS API error response:', errorText);
        throw new Error(`TTS API error: ${response.statusText} - ${errorText}`);
      }
      
      console.log('🔊 TTS response status:', response.status);
      console.log('🔊 TTS response type:', response.headers.get('content-type'));
      console.log('🔊 TTS response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      let audioBlob;
      
      if (contentType && contentType.includes('audio/')) {
        // Chirp TTS zwraca raw audio
        console.log('🔊 Raw audio response detected');
        audioBlob = await response.blob();
        console.log('🔊 Audio blob size:', audioBlob.size);
      } else {
        // Classic TTS zwraca JSON z base64
        console.log('🔊 JSON response detected');
        const data = await response.json();
        console.log('🔊 TTS response data:', { ok: data.ok, audioContentLength: data.audioContent?.length });
        
        if (!data.ok || !data.audioContent) {
          throw new Error('TTS response error: ' + (data.error || 'Unknown error'));
        }
        
        // Dekoduj base64 do blob
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        console.log('🔊 Audio blob size:', audioBlob.size);
      }
      
      if (audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
        console.log('🔊 Audio playing...');
      } else {
        console.error('❌ Empty audio blob received');
      }
    } catch (err) {
      console.error('❌ TTS error:', err);
      console.error('❌ TTS error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        text: text.substring(0, 50),
        ttsMode,
        AMBER_AUTO_SPEAK
      });
      setError('Błąd odtwarzania głosu');
    }
  };

  const playStreamingTTS = async (text: string, endpoint: string) => {
    console.log('🔴 Starting streaming TTS...');
    
    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text,
        languageCode: 'pl-PL'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Streaming TTS API error: ${response.statusText}`);
    }
    
    console.log('🔴 Streaming response status:', response.status);
    console.log('🔴 Streaming response type:', response.headers.get('content-type'));
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
    
    console.log('🔴 Playing streamed audio...');
    await audio.play();
  };

  const startLiveMicStream = async () => {
    // ⚠️ DISABLED: Live streaming powoduje problemy z performance i zmianami rozmiaru UI
    // ScriptProcessorNode jest deprecated i powoduje problemy z re-renderami
    // Użyj standardowego trybu STT zamiast live streaming
    console.warn('⚠️ Live streaming is disabled. Using standard recording mode.');
    await startGoogleSTT();
  };

  const stopRecording = () => {
    // Cleanup live streaming
    if ((window as any).liveStreamCleanup) {
      console.log('🔴 Cleaning up live stream...');
      (window as any).liveStreamCleanup();
      (window as any).liveStreamCleanup = null;
    }
    
    // Standard cleanup
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleLogoClick = () => {
    console.log('🎯 Logo clicked! isRecording:', isRecording);
    if (isRecording) {
      console.log('🛑 Stopping recording...');
      stopRecording();
    } else {
      console.log('🎙️ Starting recording...');
      startRecording();
    }
  };

  // Funkcja do określania stanu animowanego logo
  const getLogoState = () => {
    if (isRecording) return "listening";
    if (isProcessing) return "thinking";
    if (response) return "speaking";
    return "idle";
  };

  return (
    <>
      {/* Loading Screen */}
      {showLoadingScreen && (
        <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />
      )}

      {/* Amber Avatar - prawy dolny róg */}
      {!showLoadingScreen && <AmberAvatar />}

      {/* Main UI - Hero Layout */}
      <section
        className={`
          logo-hero-container text-slate-100
          transition-opacity duration-1000
          ${showLoadingScreen ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          backgroundImage: `url('/images/${isMobile ? 'background.png' : 'desk.png'}')`
        }}
      >
      {/* Header z menu po prawej stronie */}
      {!showLoadingScreen && (
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: FreeFlow Logo */}
              <div className="flex items-center">
                <div className="text-left mt-2">
                  <div className="text-3xl font-black tracking-tight">
                    <span className="text-orange-500">Free</span>
                    <span className="text-white">Flow</span>
                  </div>
                  <div className="text-sm text-white font-medium">
                    Voice to order — Złóż zamówienie
                  </div>
                  <div className="text-sm text-white font-medium">
                    Restauracja, taxi albo hotel?
                  </div>
                </div>
              </div>

              {/* Right: Cart + Menu */}
              <div className="flex items-center gap-2">
                {/* Cart Button - Normal Icon */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  style={{ cursor: 'pointer', zIndex: 101 }}
                >
                  <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-orange-500/50 transition-all relative group"
                    title="Koszyk"
                  >
                    {/* Shopping Cart Icon */}
                    <svg className="w-6 h-6 text-white group-hover:text-orange-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    
                  </button>
                </motion.div>

                {/* Menu Button (opens glassmorphism MenuDrawer) */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  style={{ cursor: 'pointer', zIndex: 101 }}
                >
                  <button
                    onClick={openDrawer}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* MenuDrawer */}
      <MenuDrawer />
      
      {/* Cart Popup */}
      <Cart />

      {/* Główny kontener logo - Hero */}
      <div className="logo-main-container" onClick={handleLogoClick}>
        {/* Animowane pierścienie podczas nagrywania - tylko gdy rzeczywiście nagrywamy i nie ma błędów */}
        {isRecording && !isProcessing && !error && (
          <>
            <div className="logo-recording-rings" style={{animationDelay: '0.1s'}} />
            <div className="logo-recording-rings" style={{animationDelay: '0.4s'}} />
            <div className="logo-recording-rings" style={{animationDelay: '0.7s'}} />
          </>
        )}
        
        {/* Tło logo */}
        <div className="logo-background" />
        
        {/* Efekt nagrywania - tylko gdy rzeczywiście nagrywamy i nie ma błędów */}
        {isRecording && !error && !isProcessing && (
          <div className="logo-recording-bg" />
        )}
        
        {/* Główne logo */}
        <img
          src="/images/Freeflowlogo.png"
          alt="FreeFlow Logo"
          className="logo-image"
        />
      </div>

      {/* Dynamiczne wyskakujące wiadomości */}
      <DynamicPopups 
        messages={dynamicMessages} 
        isVisible={!showLoadingScreen} 
      />

      {/* Elementy pod logo */}
      <div className="logo-content-below">
          
        {/* Status Display */}
        {(isProcessing || error) && (
          <div className="w-full max-w-md p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 mb-4">
            {error && (
              <div className="text-red-400 text-sm mb-2">
                ❌ {error}
              </div>
            )}
            {isProcessing && !error && (
              <div className="text-blue-300 text-sm mb-2 animate-pulse">
                ⏳ Przetwarzam...
              </div>
            )}
          </div>
        )}

        {/* Wyniki menu */}
        {menuItems.length > 0 && (
          <div className="w-full max-w-2xl">
            <MenuView menuItems={menuItems} onAddToCart={handleAddToCart} />
          </div>
        )}

        {/* 🎛️ Amber Status Indicator */}
        <div className="amber-status-container">
          <AmberStatus state={amberState} />
        </div>

        {/* Pole transkrypcji */}
        <div className="voice-input-container">
          {isRecording ? (
            <VoiceBar />
          ) : (
            <VoiceTextBox
              value={transcript}
              onChange={setTranscript}
              onSubmit={handleTextInputSubmit}
              chatHistory={[]}
              placeholder="Wpisz lub powiedz co chcesz zamówić..."
              onTTSModeChange={handleTTSModeChange}
            />
          )}
        </div>

        {/* 3 panele w rzędzie */}
        <div className="options-grid">
          <Tile onClick={() => handleOptionClick('Jedzenie')}><span className="text-2xl">🍽️</span>&nbsp;Jedzenie</Tile>
          <Tile onClick={() => handleOptionClick('Taxi')}><span className="text-2xl">🚕</span>&nbsp;Taxi</Tile>
          <Tile onClick={() => handleOptionClick('Hotel')}><span className="text-2xl">🏨</span>&nbsp;Hotel</Tile>
        </div>
      </div>
      
    </section>
    </>
  );
}

/** Kafelek o stałej wysokości i tym samym stylu */
function Tile({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400 }}
      className="
        h-16 w-full
        rounded-lg bg-orange-900/20 ring-1 ring-orange-400/30 backdrop-blur
        text-orange-100 font-semibold text-sm sm:text-base
        shadow-[0_4px_15px_rgba(0,0,0,.25)]
        hover:bg-orange-900/30 hover:ring-orange-400/50
        cursor-pointer
        flex items-center justify-center
        text-lg
      "
    >
      {children}
    </motion.button>
  );
}
