// FreeFlow Configuration
export const CONFIG = {
  // Backend URL - single source of truth
  BACKEND_URL: process.env.NODE_ENV === 'production' 
    ? 'https://freeflow-backend.vercel.app'
    : 'http://localhost:3000',
  
  // API Endpoints
  ENDPOINTS: {
    STT: '/api/stt',
    TTS: '/api/tts', 
    BRAIN: '/api/freeflow-brain',
    AGENT: '/api/agent',
    AMBER_SPEAK: '/api/amber-speak'
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${CONFIG.BACKEND_URL}${endpoint}`;
};

// Export individual URLs for convenience
export const API_URLS = {
  STT: getApiUrl(CONFIG.ENDPOINTS.STT),
  TTS: getApiUrl(CONFIG.ENDPOINTS.TTS),
  BRAIN: getApiUrl(CONFIG.ENDPOINTS.BRAIN),
  AGENT: getApiUrl(CONFIG.ENDPOINTS.AGENT),
  AMBER_SPEAK: getApiUrl(CONFIG.ENDPOINTS.AMBER_SPEAK)
};
