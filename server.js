const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { v1: SpeechClient } = require("@google-cloud/speech");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // bo lecą base64

const ttsClient = new TextToSpeechClient();
const sttClient = new SpeechClient();

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --------- TTS ----------
app.post("/api/tts", async (req, res) => {
  try {
    const { text, lang = "pl-PL", voiceName = "pl-PL-Wavenet-D" } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: "Missing text" });

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode: lang, name: voiceName, ssmlGender: "MALE" },
      audioConfig: { audioEncoding: "MP3" },
    });

    res.json({ audioBase64: response.audioContent?.toString("base64") || "" });
  } catch (e) {
    console.error("TTS error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// --------- STT ----------
app.post("/api/stt", async (req, res) => {
  try {
    const { audioBase64, lang = "pl-PL" } = req.body || {};
    if (!audioBase64) return res.status(400).json({ error: "Missing audioBase64" });

    const audio = { content: audioBase64 };
    const config = {
      languageCode: lang,
      encoding: "MP3", // zmień na "WEBM_OPUS" jeśli nagrywasz webm/opus
      enableAutomaticPunctuation: true,
    };

    const [sttResp] = await sttClient.recognize({ audio, config });
    const text = (sttResp.results || [])
      .flatMap(r => r.alternatives || [])
      .map(a => a.transcript)
      .join(" ")
      .trim();

    res.json({ text });
  } catch (e) {
    console.error("STT error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log("Backend listening on", PORT));
