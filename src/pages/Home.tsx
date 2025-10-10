/* eslint-disable jsx-a11y/alt-text */
import { useState, useRef, useEffect } from "react";
// @ts-ignore
import MenuDrawer from "../ui/MenuDrawer";
import MenuView from "./MenuView";
import ChatHistory from "./ChatHistory";
import VoiceTextBox from "../components/VoiceTextBox";
import { useUI } from "../state/ui";
import { Send } from 'lucide-react';
import api from "../lib/api";

export default function Home() {
  const openDrawer = useUI((s) => s.openDrawer);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("pl-PL-Standard-A");
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [currentAction, setCurrentAction] = useState("");
  const [chatHistory, setChatHistory] = useState<{ speaker: 'user' | 'agent', text: string }[]>([]);
  
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
      const data = await api(`/api/menu?restaurant_id=${restaurantId}`, { method: 'GET' });
      console.log('📋 Menu data:', data);
      
      if (data.menu && Array.isArray(data.menu)) {
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
    setChatHistory([]);
  };
  const startRecording = async () => {
    setIsRecording(true);
    setError("");
    setTranscript("Nasłuchuję...");
    
    try {
      // Spróbuj Web Speech API najpierw
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        startWebSpeechRecognition();
      } else {
        // Fallback na Google STT
        await startGoogleSTT();
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
      const response = await api('https://freeflow-backend.vercel.app/api/stt', {
        method: 'POST',
        body: formData,
      });
      
      if (response.transcript) {
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
    try {
      setTranscript(text);
      setChatHistory(prev => [...prev, { speaker: 'user', text }]);
      setError("");
      setResponse("");
      setRestaurants([]);
      setMenuItems([]);
      
      setCurrentAction("");
      console.log('🎯 Sending to Dialogflow:', text);
      
      // Wyślij do Dialogflow
      const result = await api('https://freeflow-backend.vercel.app/api/dialogflow-freeflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      console.log('🤖 Dialogflow response:', result);

      if (result.fulfillmentText) {
        setResponse(result.fulfillmentText);
        setChatHistory(prev => [...prev, { speaker: 'agent', text: result.fulfillmentText }]);

        // 1. Sprawdź czy odpowiedź zawiera custom_payload z menu
        if (result.customPayload && result.customPayload.menu_items) {
          console.log('📄 Received custom_payload with menu items:', result.customPayload.menu_items);
          // 2. Ustaw menu_items w stanie i akcję na 'menu'
          setMenuItems(result.customPayload.menu_items);
          setCurrentAction('menu');
        } else if (result.action === 'show_restaurants' || text.toLowerCase().includes('restauracje')) {
          // Jeśli nie ma menu, ale akcja to pokazanie restauracji
          setCurrentAction('restaurants'); // Pokaż listę restauracji
          await loadRestaurants(); // Załaduj dane restauracji
        }

        // Jeśli nie ma payloadu, ale jest tekst odpowiedzi, odtwórz go
        if (result.fulfillmentText) {
          await playTTS(result.fulfillmentText);
        }
      } else {
        setError('Brak odpowiedzi od Dialogflow');
      }
    } catch (err) {
      console.error('❌ Voice process error:', err);
      setError(`Błąd przetwarzania głosu: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      console.log('🍽️ Loading restaurants...');
      const data = await api('/api/restaurants', { method: 'GET' });
      console.log('🏪 Restaurants data:', data);
      
      if (data.restaurants && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants);
      } else {
        // Fallback - przykładowe restauracje
        const mockRestaurants = [
          { id: '1', name: 'Pizza Hut', address: 'ul. Główna 1, Piekary Śląskie', rating: 4.5 },
          { id: '2', name: 'KFC', address: 'ul. Centralna 15, Piekary Śląskie', rating: 4.2 },
          { id: '3', name: 'McDonald\'s', address: 'ul. Handlowa 8, Piekary Śląskie', rating: 4.0 },
          { id: '4', name: 'Burger King', address: 'ul. Rynkowa 22, Piekary Śląskie', rating: 4.3 },
          { id: '5', name: 'Subway', address: 'ul. Szkolna 5, Piekary Śląskie', rating: 4.1 }
        ];
        setRestaurants(mockRestaurants);
      }
    } catch (err) {
      console.error('❌ Error loading restaurants:', err);
      // Fallback - przykładowe restauracje
      const mockRestaurants = [
        { id: '1', name: 'Pizza Hut', address: 'ul. Główna 1, Piekary Śląskie', rating: 4.5 },
        { id: '2', name: 'KFC', address: 'ul. Centralna 15, Piekary Śląskie', rating: 4.2 },
        { id: '3', name: 'McDonald\'s', address: 'ul. Handlowa 8, Piekary Śląskie', rating: 4.0 },
        { id: '4', name: 'Burger King', address: 'ul. Rynkowa 22, Piekary Śląskie', rating: 4.3 },
        { id: '5', name: 'Subway', address: 'ul. Szkolna 5, Piekary Śląskie', rating: 4.1 }
      ];
      setRestaurants(mockRestaurants);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const response = await api('https://freeflow-backend.vercel.app/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice,
          languageCode: 'pl-PL'
        }),
      });
      
      if (response.audioContent) {
        // Konwertuj base64 na audio i odtwórz
        const audioBlob = new Blob([
          Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
      setError('Błąd odtwarzania głosu');
    }
  };

  const stopRecording = () => {
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
    <section
      className="
        relative min-h-screen text-slate-100
        bg-cover bg-center bg-no-repeat
      "
      style={{
        backgroundImage: "url('/images/hero-bg-blur.png')"
      }}
    >
      {/* Logo FreeFlow na górze - hasło jak na screenshocie */}
      <div className="absolute top-4 left-4 z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            <span className="text-orange-400">Free</span>
            <span className="text-white">Flow</span>
          </h1>
          <p className="text-white/90 text-base mt-1">
            Voice to order — <span className="font-medium">Złóż zamówienie</span>
          </p>
          <p className="text-white/70 text-sm">
            Restauracja, taxi albo hotel?
          </p>
        </div>
      </div>

      {/* Ikonki po prawej */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        {/* Koszyk */}
        <button className="
          w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm
          border border-orange-400/20 text-orange-200
          flex items-center justify-center
          hover:bg-black/30 hover:border-orange-400/40 transition-all
          focus:outline-none
        ">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
          </svg>
        </button>

        {/* Kompaktowy Hamburger Menu */}
        <button
          onClick={openDrawer}
          className="
            w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md
            border border-white/10 text-white/90
            flex items-center justify-center
            hover:from-slate-700/90 hover:to-slate-800/90 hover:border-white/20 hover:text-white
            hover:scale-105 hover:shadow-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-orange-400/50
          "
          aria-label="Otwórz menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* MenuDrawer */}
      <MenuDrawer />

      {/* Główna kolumna: mobile layout */}
      <div className="mx-auto max-w-3xl px-4 min-h-screen flex flex-col justify-center items-center">
        
        <div className="w-full flex flex-col items-center space-y-1 pt-4">
          
          {(() => {
            const hasResults = restaurants.length > 0 || menuItems.length > 0;
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
                    {currentAction === 'restaurants' && restaurants.length > 0 && (
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
                    )}
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

          {/* Pole transkrypcji z animacją demo */}
          <div className="w-full max-w-2xl relative -mt-8 mb-1">
            <VoiceTextBox
              value={transcript}
              onChange={setTranscript}
              onSubmit={handleTextInputSubmit}
              chatHistory={chatHistory}
              placeholder={isRecording ? "🎙️ Nasłuchuję..." : "Wpisz lub powiedz co chcesz zamówić..."}
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
