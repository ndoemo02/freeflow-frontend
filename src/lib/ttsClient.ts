// src/lib/ttsClient.ts

export interface TtsOptions {
  lang?: string;
  voiceName?: string;
  gender?: 'MALE' | 'FEMALE';
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface TtsResponse {
  ok: boolean;
  audioContent?: string;
  audioEncoding?: string;
  voice?: string;
  language?: string;
  textLength?: number;
  error?: string;
  message?: string;
}

// Available Polish voices
export const POLISH_VOICES = {
  'pl-PL-Wavenet-A': { name: 'pl-PL-Wavenet-A', gender: 'FEMALE', description: 'Kobieta (Wavenet)' },
  'pl-PL-Wavenet-B': { name: 'pl-PL-Wavenet-B', gender: 'MALE', description: 'Mężczyzna (Wavenet)' },
  'pl-PL-Wavenet-C': { name: 'pl-PL-Wavenet-C', gender: 'FEMALE', description: 'Kobieta 2 (Wavenet)' },
  'pl-PL-Wavenet-D': { name: 'pl-PL-Wavenet-D', gender: 'MALE', description: 'Mężczyzna 2 (Wavenet)' },
  'pl-PL-Standard-A': { name: 'pl-PL-Standard-A', gender: 'FEMALE', description: 'Kobieta (Standard)' },
  'pl-PL-Standard-B': { name: 'pl-PL-Standard-B', gender: 'MALE', description: 'Mężczyzna (Standard)' },
  'pl-PL-Standard-C': { name: 'pl-PL-Standard-C', gender: 'FEMALE', description: 'Kobieta 2 (Standard)' },
  'pl-PL-Standard-D': { name: 'pl-PL-Standard-D', gender: 'MALE', description: 'Mężczyzna 2 (Standard)' }
};

export async function speakTts(text: string, opts: TtsOptions = {}): Promise<HTMLAudioElement> {
  console.log("🎤 TTS Client: Starting TTS request for text:", text);
  
  const defaultOpts: TtsOptions = {
    lang: 'pl-PL',
    voiceName: 'pl-PL-Wavenet-A',
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0.0,
    volumeGainDb: 0.0,
    ...opts
  };

  const body = JSON.stringify({ text, ...defaultOpts });
  
  // Use the correct API endpoint based on environment
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://freeflow-backend.vercel.app/api/tts'
    : 'http://localhost:3003/api/tts';
  
  console.log("🎤 TTS Client: Making request to:", apiUrl);
  console.log("🎤 TTS Client: Request body:", body);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  
  console.log("🎤 TTS Client: Response status:", response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("🎤 TTS Client: Error response:", errorData);
    throw new Error(`TTS HTTP ${response.status}: ${errorData.message || response.statusText}`);
  }
  
  const data: TtsResponse = await response.json();
  console.log("🎤 TTS Client: Response data:", data);
  
  if (!data.ok || !data.audioContent) {
    console.error("🎤 TTS Client: TTS synthesis failed:", data);
    throw new Error(data.message || 'TTS synthesis failed');
  }
  
  // Determine MIME type based on audio encoding
  let mimeType = 'audio/mpeg'; // default for MP3
  switch (data.audioEncoding) {
    case 'LINEAR16':
      mimeType = 'audio/wav';
      break;
    case 'OGG_OPUS':
      mimeType = 'audio/ogg';
      break;
    case 'MP3':
    default:
      mimeType = 'audio/mpeg';
      break;
  }
  
  const audio = new Audio(`data:${mimeType};base64,${data.audioContent}`);
  console.log("🎤 TTS Client: Created audio element, starting playback...");
  
  return new Promise((resolve, reject) => {
    audio.onended = () => {
      console.log("🎤 TTS Client: Audio playback completed");
      resolve(audio);
    };
    audio.onerror = (error) => {
      console.error('🎤 TTS Client: Audio playback error:', error);
      reject(new Error('Audio playback failed'));
    };
    audio.play().then(() => {
      console.log("🎤 TTS Client: Audio playback started successfully");
    }).catch((error) => {
      console.error("🎤 TTS Client: Failed to start audio playback:", error);
      reject(error);
    });
  });
}

// Helper function to get available voices by gender
export function getVoicesByGender(gender: 'MALE' | 'FEMALE') {
  return Object.values(POLISH_VOICES).filter(voice => voice.gender === gender);
}

// Helper function to get all available voices
export function getAllVoices() {
  return Object.values(POLISH_VOICES);
}

// Helper function to speak with specific voice
export async function speakWithVoice(text: string, voiceName: keyof typeof POLISH_VOICES) {
  return speakTts(text, { voiceName });
}

// Helper function to speak with gender preference
export async function speakWithGender(text: string, gender: 'MALE' | 'FEMALE') {
  return speakTts(text, { gender });
}