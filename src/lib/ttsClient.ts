// src/lib/ttsClient.ts
export async function speakTts(text: string, opts?: { lang?: string; voiceName?: string; gender?: string; audioEncoding?: string }) {
  const body = JSON.stringify({ text, ...(opts || {}) });
  const response = await fetch('http://localhost:3003/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  
  if (!response.ok) {
    throw new Error(`TTS HTTP ${response.status}`);
  }
  
  const { audioContent } = await response.json();
  const mime = 'audio/mpeg';
  const audio = new Audio(`data:${mime};base64,${audioContent}`);
  
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve(audio);
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}