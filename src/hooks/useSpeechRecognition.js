// src/hooks/useSpeechRecognition.js
import { useState, useEffect, useRef } from "react";

const SILENCE_MS = 1200;
const MAX_RECORDING_MS = 8000;

export function useSpeechRecognition({ onTranscriptChange }) {
  const [recording, setRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hardStopTimerRef = useRef(null);
  const finalStrRef = useRef("");

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
      setInterimText(interimStr);
      setFinalText(finalStr);

      const merged = (finalStr + " " + interimStr).trim();
      if (onTranscriptChange) {
        onTranscriptChange(merged);
      }

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
      setInterimText("");
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
  }, [onTranscriptChange]);

  const startRecording = () => {
    finalStrRef.current = "";
    recognitionRef.current?.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  return { recording, interimText, finalText, startRecording, stopRecording };
}