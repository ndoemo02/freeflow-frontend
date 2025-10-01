*** Begin Patch
*** Update File: src/pages/HomeClassic.jsx
@@
-import { api, tts as ttsApi } from "../lib/api";
+import { api } from "../lib/api";
+import { speakTts } from "../lib/ttsClient";
@@
-  const lastSpeakPromiseRef = useRef(Promise.resolve()); // kolejka mowy
+  const lastSpeakPromiseRef = useRef(Promise.resolve()); // kolejka mowy (nie nakładaj dźwięków)
@@
-  // Basic TTS helper
-  // Real talker: rozwiązuje się po zakończeniu odtwarzania
-  const speakNow = async (text) => {
-    try {
-      // Try Google Cloud TTS first
-      try {
-        const audio = await ttsApi(text, { lang: 'pl-PL', voiceName: 'pl-PL-Wavenet-D' });
-        return await new Promise((resolve) => {
-          speakingRef.current = true;
-          setSpeaking(true);
-          audio.onended = () => { speakingRef.current = false; setSpeaking(false); resolve(); };
-          audio.onerror = () => { speakingRef.current = false; setSpeaking(false); resolve(); };
-          audio.play().catch(() => { speakingRef.current = false; setSpeaking(false); resolve(); });
-        });
-      } catch (_) {
-        // fallback to browser TTS
-      }
-      if ('speechSynthesis' in window) {
-        return await new Promise((resolve) => {
-          const synth = window.speechSynthesis;
-          synthRef.current = synth;
-          try { synth.cancel(); } catch (_) {}
-          const u = new SpeechSynthesisUtterance(text);
-          u.lang = 'pl-PL';
-          const voices = synth.getVoices ? synth.getVoices() : [];
-          const pl = voices.find(v => /pl/i.test(v.lang));
-          if (pl) u.voice = pl;
-          speakingRef.current = true;
-          setSpeaking(true);
-          u.onend = () => { speakingRef.current = false; setSpeaking(false); resolve(); };
-          u.onerror = () => { speakingRef.current = false; setSpeaking(false); resolve(); };
-          synth.speak(u);
-        });
-      }
-    } catch (e) {
-      console.warn('TTS not available', e);
-    }
-  };
+  // TTS: jeden punkt wejścia, z deduplikacją i cache po stronie klienta
+  const speakNow = async (text) => {
+    try {
+      speakingRef.current = true;
+      setSpeaking(true);
+      await speakTts(text, { lang: "pl-PL", voice: "pl-PL-Wavenet-D" });
+    } catch (e) {
+      console.warn("TTS failed", e);
+    } finally {
+      speakingRef.current = false;
+      setSpeaking(false);
+    }
+  };
@@
   const speak = (text) => {
     lastSpeakPromiseRef.current = lastSpeakPromiseRef.current
       .catch(() => {})
-      .then(() => speakNow(text));
+      .then(() => speakNow(text));
     return lastSpeakPromiseRef.current;
   };
*** End Patch
