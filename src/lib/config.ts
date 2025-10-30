const detectBackend = () => {
  // Lokalnie kieruj na port 3000 jeśli brak env
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return 'https://freeflow-backend.vercel.app';
};

export const CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || detectBackend(),

  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

  APP_MODE: import.meta.env.MODE || "development",
  DEBUG: true,

  AMBER_LOGS: true,
  AMBER_BRAIN: true,
};

// Funkcja do budowania URL API
export function getApiUrl(path: string): string {
  const baseUrl = CONFIG.BACKEND_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}