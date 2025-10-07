import React, { useEffect, useRef, useState } from "react";

// Podpowiedzi dla użytkowników
const SUGGESTIONS = [
  "Chciałbym zamówić pizzę",
  "Chciałbym zamówić spaghetti",
  "Zamawiam taksówkę o 19:00 na dworzec",
  "Nocleg na weekend",
  "Rezerwacja stolika na 2 osoby",
  "Menu na dzisiaj",
  "Godziny otwarcia",
  "Dostawa do domu",
  "Płatność kartą",
  "Anuluj zamówienie",
  "Chciałbym zamówić kawę",
  "Zamawiam taksówkę na lotnisko",
  "Hotel na jedną noc",
  "Rezerwacja na 4 osoby",
  "Co polecacie na obiad?",
  "Czy macie wegetariańskie opcje?",
  "Dostawa do biura",
  "Płatność gotówką",
  "Sprawdź moje zamówienie",
  "Zmiana adresu dostawy",
  "Chciałbym zamówić sushi",
  "Taksówka na dworzec PKP",
  "Apartament na tydzień",
  "Stolik przy oknie",
  "Aktualne promocje",
  "Czas oczekiwania na zamówienie"
];

/**
 * Text box z rozpoznawaniem mowy:
 * - przycisk Start/Stop
 * - interim results (na żywo)
 * - podpowiedzi w trybie live
 * - aktualizuje parent przez onChange/onSubmit
 */
export default function VoiceTextBox({
  value,
  onChange,
  onSubmit,
  chatHistory = [],
  placeholder = "Mów tutaj…",
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [demoText, setDemoText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);
  const recognitionRef = useRef(null);
  const interimRef = useRef("");

  useEffect(() => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "pl-PL";

    rec.onresult = (e) => {
      let interim = "";
      let finalChunk = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) {
          finalChunk += txt + " ";
        } else {
          interim += txt + " ";
        }
      }

      // pokazuj interim „na żywo” (nie nadpisuj finalnej wartości)
      interimRef.current = interim;
      if (finalChunk) {
        onChange?.(`${value ?? ""}${finalChunk}`);
        interimRef.current = ""; // wyczyść
      }
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, [onChange, value]);

  const start = () => {
    if (!supported) return;
    if (listening) return;
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {}
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };


  // Animacja pisania literka po literce
  const typeText = (text, callback) => {
    setIsTyping(true);
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDemoText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 100); // 100ms na literkę
  };

  // Rozpocznij demo po 1 sekundzie z pętlą przykładów
  useEffect(() => {
    let currentIndex = 0;
    let isRunning = true;

    const showNextExample = () => {
      if (!isRunning) return;
      
      const example = SUGGESTIONS[currentIndex];
      typeText(example, () => {
        setTimeout(() => {
          setDemoText("");
          currentIndex = (currentIndex + 1) % SUGGESTIONS.length;
          setTimeout(showNextExample, 1500);
        }, 2000);
      });
    };

    // Rozpocznij po 1 sekundzie
    setTimeout(() => {
      showNextExample();
    }, 1000);

    // Zatrzymaj demo po 30 sekundach
    const stopDemo = setTimeout(() => {
      isRunning = false;
      setDemoText("");
    }, 30000);

    return () => {
      isRunning = false;
      clearTimeout(stopDemo);
    };
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setHasInteraction(true);
      onSubmit?.(value?.trim?.() ?? "");
    }
  };

  // Ustaw hasInteraction na true gdy pojawi się historia rozmowy
  useEffect(() => {
    if (chatHistory.length > 0) {
      setHasInteraction(true);
    }
  }, [chatHistory]);

  // Ustaw hasInteraction na true gdy użytkownik zacznie pisać
  const handleChange = (e) => {
    if (e.target.value.trim()) {
      setHasInteraction(true);
    }
    onChange?.(e.target.value);
  };


  // Formatuj historię rozmowy
  const formatChatHistory = () => {
    if (chatHistory.length === 0) return "";
    
    return chatHistory.map((entry, index) => {
      const prefix = entry.speaker === 'user' ? '👤 Ty: ' : '🤖 Agent: ';
      return `${prefix}${entry.text}`;
    }).join('\n\n');
  };

  const displayValue = demoText || `${hasInteraction ? formatChatHistory() : ''}${hasInteraction && chatHistory.length > 0 ? '\n\n' : ''}${value || ""}${interimRef.current ? `${value ? " " : ""}${interimRef.current}` : ""}`;

  return (
    <div className="ff-voicebox">
      <textarea
        className={`ff-input-large ${hasInteraction ? 'expanded' : ''}`}
        rows={hasInteraction ? 6 : 2}
        placeholder={supported ? "Mów tutaj..." : "Mikrofon wymaga HTTPS lub localhost (brak wsparcia)"}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKey}
        readOnly={isTyping} // Zablokuj edycję podczas demo
      />
    </div>
  );
}




