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
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer";
import MenuView from "./MenuView";
import ChatHistory from "./ChatHistory";
import VoiceTextBox from "../components/VoiceTextBox";
import AmberStatus from "../components/AmberStatus";
import TTSSwitcher from "../components/TTSSwitcher";
import LoadingScreen from "../components/LoadingScreen";
// @ts-ignore
import AmberAvatar from "../components/AmberAvatar";
import { useUI } from "../state/ui";
import { useCart } from "../state/CartContext";
import { Send } from 'lucide-react';
import api from "../lib/api";
import { getApiUrl } from "../lib/config";

export default function Home() {
  const openDrawer = useUI((s) => s.openDrawer);
  const { addToCart } = useCart();
  const [isRecording, setIsRecording] = useState(false);
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
  const [chatHistory, setChatHistory] = useState<{ speaker: 'user' | 'agent', text: string }[]>([]);
  const [cartPopup, setCartPopup] = useState<{ show: boolean, message: string, type: 'success' | 'info' | 'error' }>({ show: false, message: '', type: 'info' });
  const [showCart, setShowCart] = useState(false);
  const [botStatus, setBotStatus] = useState<'idle' | 'thinking' | 'speaking' | 'confused'>('idle');
  const [amberState, setAmberState] = useState<'ready' | 'thinking' | 'error' | 'idle'>('ready');
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  
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

  const showCartPopup = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setCartPopup({ show: true, message, type });
    setTimeout(() => {
      setCartPopup({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const toggleCart = () => {
    setShowCart(!showCart);
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
    setChatHistory([]);
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
      setChatHistory(prev => [...prev, { speaker: 'user', text }]);
      setError("");
      setResponse("");
      setRestaurants([]);
      setMenuItems([]);
      
      setCurrentAction("");
      console.log('🎯 Sending to FreeFlow Brain:', text);
      
      // Wyślij do FreeFlow Brain
      const res = await fetch(getApiUrl('/api/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          lat: 50.386,
          lng: 18.946, // Piekary Śląskie
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

      // 🎯 OBSŁUGA PARSED_ORDER - dodaj do koszyka
      if (data.parsed_order && data.parsed_order.items && data.parsed_order.restaurant) {
        console.log('🛒 Voice order detected, adding to cart:', data.parsed_order);
        
        try {
          // Dodaj każdą pozycję do koszyka
          for (const item of data.parsed_order.items) {
            addToCart({
              id: item.menuItemId || item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity || 1
            }, data.parsed_order.restaurant);
          }
          
          showCartPopup('🛒 Dodano do koszyka z voice ordering!', 'success');
          console.log('✅ Voice order items added to cart successfully');
        } catch (error) {
          console.error('❌ Error adding voice order to cart:', error);
          showCartPopup('❌ Błąd dodawania do koszyka', 'error');
        }
      }

      if (data.reply || data.response) {
        const responseText = data.reply || data.response;
        setResponse(responseText);
        setChatHistory(prev => [...prev, { speaker: 'agent', text: responseText }]);
        setAmberState('ready');

        // Sprawdź czy Amber dodała coś do koszyka (stara logika)
        const responseTextLower = responseText.toLowerCase();
        if (responseTextLower.includes('dodaję') || responseTextLower.includes('zamawiam') || responseTextLower.includes('dodano') || 
            responseTextLower.includes('koszyk') || responseTextLower.includes('zamówienie') || responseTextLower.includes('gotowe')) {
          showCartPopup('🛒 ' + responseText, 'success');
        } else if (responseTextLower.includes('nie mogę') || responseTextLower.includes('błąd') || responseTextLower.includes('przepraszam')) {
          showCartPopup('❌ ' + responseText, 'error');
        }

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
      const endpoint = ttsMode === "classic" ? "/api/tts" : "/api/tts-chirp-hd";
      console.log(`🎙️ TTS mode: ${ttsMode} → ${endpoint}`);
      console.log('🌐 Using endpoint:', endpoint);

      // Na razie używamy standardowego TTS dla obu trybów
      // (WebSocket streaming będzie dodany później)

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          languageCode: 'pl-PL'
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
      
      // Sprawdź content-type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('audio/')) {
        const errorText = await response.text();
        console.error('❌ Unexpected content type:', contentType, 'Response:', errorText);
        throw new Error(`Unexpected content type: ${contentType}`);
      }
      
      // Backend zwraca surowe audio, nie JSON
      const audioBlob = await response.blob();
      console.log('🔊 Audio blob size:', audioBlob.size);
      
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
    try {
      console.log('🔴 Initializing live mic stream...');
      
      // Utwórz WebSocket połączenie
      const socket = new WebSocket("ws://localhost:3000/api/stt-stream");
      
      // Pobierz dostęp do mikrofonu
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Utwórz AudioContext
      const audioCtx = new AudioContext({ sampleRate: 44100 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      // Połącz węzły audio
      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Obsługa danych audio
      processor.onaudioprocess = (e) => {
        if (socket.readyState === WebSocket.OPEN) {
          const chunk = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(chunk.length);
          
          // Konwersja float32 na int16
          for (let i = 0; i < chunk.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, chunk[i] * 32768));
          }
          
          // Wyślij chunk audio
          socket.send(int16.buffer);
        }
      };

      // Obsługa wiadomości z WebSocket
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🧠 Live transcription:", data);
          
          if (data.transcript) {
            setTranscript(data.transcript);
            
            // Jeśli to finalna transkrypcja, przetwórz ją
            if (data.isFinal) {
              handleVoiceProcess(data.transcript);
            }
          }
        } catch (err) {
          console.error('Error parsing STT response:', err);
        }
      };

      socket.onopen = () => {
        console.log('🔴 Live STT WebSocket connected');
        setTranscript("🔴 Live streaming active...");
      };

      socket.onclose = () => {
        console.log('🔴 Live STT WebSocket closed');
        setIsRecording(false);
      };

      socket.onerror = (error) => {
        console.error('🔴 Live STT WebSocket error:', error);
        setError('Błąd połączenia live streaming');
        setIsRecording(false);
      };

      // Zapisz referencje do cleanup
      (window as any).liveStreamCleanup = () => {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        audioCtx.close();
        socket.close();
      };

    } catch (err) {
      console.error('🔴 Live mic stream error:', err);
      setError('Błąd inicjalizacji live streaming');
      setIsRecording(false);
    }
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

  return (
    <>
      {/* Loading Screen */}
      {showLoadingScreen && (
        <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />
      )}

      {/* Amber Avatar - prawy dolny róg */}
      {!showLoadingScreen && <AmberAvatar />}

      {/* Main UI */}
      <section
        className={`
          relative min-h-screen text-slate-100
          bg-cover bg-center bg-no-repeat
          transition-opacity duration-1000
          ${showLoadingScreen ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          backgroundImage: "url('/images/hero-bg-blur.png')"
        }}
      >
      {/* Header z menu po prawej stronie */}
      {!showLoadingScreen && (
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Empty space */}
              <div className="flex items-center">
                {/* Pusty div dla równowagi */}
              </div>

              {/* Right: Action Buttons + Menu */}
              <div className="flex items-center gap-2">
                {/* Cart Button */}
                <button
                  onClick={() => setShowCart(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all relative"
                  title="Koszyk"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  {/* Cart Badge */}
                  {cartPopup.show && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">!</span>
                    </div>
                  )}
                </button>

                {/* Menu Button - przeniesiony na prawą stronę */}
                <button
                  onClick={openDrawer}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* MenuDrawer */}
      <MenuDrawer />

      {/* Główna kolumna: mobile layout */}
      <div className="mx-auto max-w-3xl px-4 min-h-screen flex flex-col justify-center items-center">
        
        <div className="w-full flex flex-col items-center space-y-1 pt-4">
          
          {(() => {
            const hasResults = /* restaurants.length > 0 || */ menuItems.length > 0;
            const viewState = isProcessing
              ? 'LOADING'
              : hasResults
              ? 'SHOWING_RESULTS'
              : 'IDLE';
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

            switch (viewState) {
              case 'LOADING':
                return (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-orange-200">Przetwarzam...</p>
                  </div>
                );
              case 'SHOWING_RESULTS':
                return (
                  <div className="w-full max-w-2xl">
                    {/* {currentAction === 'restaurants' && restaurants.length > 0 && (
                      <div className="w-full p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 mb-4">
                        <h3 className="text-orange-400 text-lg font-semibold mb-3 flex items-center">
                          🍽️ Restauracje w okolicy
                        </h3>
                        <div className="space-y-2">
                          {restaurants.map((restaurant, index) => (
                            <div
                              key={restaurant.id || index}
                              className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/30 hover:bg-slate-600/60 transition-colors cursor-pointer"
                              onClick={() => handleRestaurantSelect(restaurant)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{restaurant.name}</h4>
                                  <p className="text-slate-300 text-xs mt-1">{restaurant.address}</p>
                                </div>
                                {restaurant.rating && (
                                  <div className="flex items-center text-yellow-400 text-xs">
                                    ⭐ {restaurant.rating}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )} */}
                    {currentAction === 'menu' && (
                      <MenuView menuItems={menuItems} onAddToCart={handleAddToCart} />
                    )}
                  </div>
                );
              case 'IDLE':
              default:
                return (
                  <div 
                    className="w-[360px] sm:w-[420px] md:w-[460px] aspect-[3/4] relative select-none cursor-pointer"
                    onClick={handleLogoClick}
                  >
                    {isRecording && (
                      <>
                        <div className="absolute inset-[-8px] rounded-full border-2 border-orange-400/60 bg-transparent animate-ping z-0" style={{animationDelay: '0.1s'}} />
                        <div className="absolute inset-[-16px] rounded-full border-2 border-orange-400/40 bg-transparent animate-ping z-0" style={{animationDelay: '0.4s'}} />
                        <div className="absolute inset-[-24px] rounded-full border-2 border-orange-400/20 bg-transparent animate-ping z-0" style={{animationDelay: '0.7s'}} />
                      </>
                    )}
                    <div className="absolute inset-0 rounded-[40px] z-0 bg-[conic-gradient(at_50%_30%,#ff7a18_0deg,#7c3aed_120deg,#0ea5e9_240deg,#ff7a18_360deg)] opacity-[.08] blur-3xl" />
                    {isRecording && (
                      <div className="absolute inset-0 rounded-[40px] bg-orange-400/20 blur-2xl animate-pulse z-0" />
                    )}
                    <img
                      src="/images/freeflow-drop.png"
                      alt="FreeFlow logo"
                      className={`relative z-10 h-full w-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,.45)] transition-transform duration-300 cursor-pointer ${isRecording ? 'animate-pulse scale-105' : 'hover:scale-105'}`}
                      role="button"
                      tabIndex={0}
                      aria-label="FreeFlow - naciśnij aby mówić"
                      title="Naciśnij aby mówić"
                      onClick={handleLogoClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleLogoClick();
                        }
                      }}
                    />
                  </div>
                );
            }
          })()}

          {/* 🎛️ Amber Status Indicator */}
          <div className="w-full max-w-2xl flex justify-center -mt-6 mb-2">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/30 backdrop-blur-sm border border-slate-600/30">
              <AmberStatus state={amberState} />
            </div>
          </div>

          {/* Pole transkrypcji z animacją demo */}
          <div className="w-full max-w-2xl relative -mt-8 mb-1">
            <VoiceTextBox
              value={transcript}
              onChange={setTranscript}
              onSubmit={handleTextInputSubmit}
              chatHistory={chatHistory}
              placeholder={isRecording ? "🎙️ Nasłuchuję..." : "Wpisz lub powiedz co chcesz zamówić..."}
              onTTSModeChange={handleTTSModeChange}
            />
          </div>

          {/* 3 panele w rzędzie */}
          <div className="w-full max-w-2xl grid grid-cols-3 gap-2 -mt-4">
            <Tile onClick={() => handleOptionClick('Jedzenie')}><span className="text-2xl">🍽️</span>&nbsp;Jedzenie</Tile>
            <Tile onClick={() => handleOptionClick('Taxi')}><span className="text-2xl">🚕</span>&nbsp;Taxi</Tile>
            <Tile onClick={() => handleOptionClick('Hotel')}><span className="text-2xl">🏨</span>&nbsp;Hotel</Tile>
          </div>
        </div>
        
      </div>
      
    </section>
    </>
  );
}

/** Kafelek o stałej wysokości i tym samym stylu */
function Tile({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        h-16 w-full
        rounded-lg bg-orange-900/20 ring-1 ring-orange-400/30 backdrop-blur
        text-orange-100 font-semibold text-sm sm:text-base
        shadow-[0_4px_15px_rgba(0,0,0,.25)]
        hover:bg-orange-900/30 hover:ring-orange-400/50 hover:scale-105 
        active:scale-95 transition-all duration-200
        cursor-pointer
        flex items-center justify-center
        text-lg
      "
    >
      {children}
    </button>
  );
}
