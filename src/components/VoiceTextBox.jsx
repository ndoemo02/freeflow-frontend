import React, { useEffect, useRef, useState } from "react";

/**
 * Text box z rozpoznawaniem mowy:
 * - przycisk Start/Stop
 * - interim results (na żywo)
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

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(value?.trim?.() ?? "");
    }
  };

  const displayValue = `${value || ""}${interimRef.current ? `${value ? " " : ""}${interimRef.current}` : ""}`;

  return (
    <div className="ff-voicebox">
      <textarea
        className="ff-input"
        rows={2}
        placeholder={supported ? placeholder : "Mikrofon wymaga HTTPS lub localhost (brak wsparcia)"}
        value={displayValue}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKey}
      />
      <div className="ff-voicebox__actions">
        {!listening ? (
          <button className="ff-btn ff-btn--primary" onClick={start} disabled={!supported}>
            ● Start
          </button>
        ) : (
          <button className="ff-btn ff-btn--danger" onClick={stop}>■ Stop</button>
        )}
        <button className="ff-btn" onClick={() => onSubmit?.(value?.trim?.() ?? "")}>
          Wyślij
        </button>
      </div>
    </div>
  );
}




