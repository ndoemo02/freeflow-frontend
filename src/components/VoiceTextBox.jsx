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
  "Anuluj zamówienie"
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
  placeholder = "Mów tutaj…",
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [demoText, setDemoText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  // Filtruj podpowiedzi na podstawie aktualnego tekstu
  useEffect(() => {
    const currentText = value?.toLowerCase() || "";
    if (currentText.length > 0) {
      const filtered = SUGGESTIONS.filter(suggestion => 
        suggestion.toLowerCase().includes(currentText) || 
        currentText.includes(suggestion.toLowerCase().split(' ')[0])
      );
      setSuggestions(filtered.slice(0, 3)); // Maksymalnie 3 podpowiedzi
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions(SUGGESTIONS.slice(0, 3)); // Pokaż pierwsze 3 podpowiedzi gdy pole jest puste
      setShowSuggestions(true);
    }
  }, [value]);

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

  // Pokaż podpowiedzi automatycznie po załadowaniu komponentu
  useEffect(() => {
    setSuggestions(SUGGESTIONS.slice(0, 3));
    setShowSuggestions(true);
    
    // Rozpocznij demo po 1 sekundzie
    setTimeout(() => {
      typeText("Chciałbym zamówić pizzę", () => {
        // Po napisaniu pierwszej podpowiedzi, pokaż następne
        setTimeout(() => {
          setDemoText("");
          typeText("Zamawiam taksówkę o 19:00", () => {
            setTimeout(() => {
              setDemoText("");
              typeText("Nocleg na weekend", () => {
                // Po zakończeniu demo, wyczyść pole
                setTimeout(() => {
                  setDemoText("");
                }, 2000);
              });
            }, 2000);
          });
        }, 2000);
      });
    }, 1000);
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(value?.trim?.() ?? "");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange?.(suggestion);
    setShowSuggestions(false);
  };

  const displayValue = demoText || `${value || ""}${interimRef.current ? `${value ? " " : ""}${interimRef.current}` : ""}`;

  return (
    <div className="ff-voicebox">
      <textarea
        className="ff-input"
        rows={2}
        placeholder={supported ? "Chciałbym zamówić pizzę • Zamawiam taksówkę o 19:00 • Nocleg na weekend" : "Mikrofon wymaga HTTPS lub localhost (brak wsparcia)"}
        value={displayValue}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 500)} // Dłuższe opóźnienie żeby można było kliknąć
        readOnly={isTyping} // Zablokuj edycję podczas demo
      />
      
      {/* Podpowiedzi */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="ff-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="ff-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}




