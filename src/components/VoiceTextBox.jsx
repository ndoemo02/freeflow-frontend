import React, { useEffect, useRef, useState } from "react";

// Demo napisy wyłączone

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


  // Demo napisy wyłączone

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

  const displayValue = `${hasInteraction ? formatChatHistory() : ''}${hasInteraction && chatHistory.length > 0 ? '\n\n' : ''}${value || ""}${interimRef.current ? `${value ? " " : ""}${interimRef.current}` : ""}`;

  return (
    <div className="ff-voicebox">
      <textarea
        className={`ff-input-large ${hasInteraction ? 'expanded' : ''}`}
        rows={hasInteraction ? 6 : 2}
        placeholder={supported ? "Mów tutaj..." : "Mikrofon wymaga HTTPS lub localhost (brak wsparcia)"}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKey}
        readOnly={false}
      />
    </div>
  );
}




