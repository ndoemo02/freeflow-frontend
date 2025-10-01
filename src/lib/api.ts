// src/lib/api.ts
export default async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, init);

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = text || res.statusText || 'Unknown error';
    throw new Error(`API ${res.status}: ${msg}`);
  }

  // brak body lub nie-JSON? zwróć pusty obiekt
  if (!isJson) {
    return {};
  }

  // bezpieczne parsowanie
  const raw = await res.text().catch(() => '');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // mimo Content-Type nie da się zparsować
    return {};
  }
}

export async function tts(text: string, opts?: { lang?: string; voiceName?: string; gender?: string; audioEncoding?: string }): Promise<HTMLAudioElement> {
  const body = JSON.stringify({ text, ...(opts || {}) });
  const { audioContent, contentType } = await api<{ audioContent: string; contentType?: string }>(
    '/api/tts',
    { method: 'POST', body }
  );
  const mime = contentType || 'audio/mpeg';
  const audio = new Audio(`data:${mime};base64,${audioContent}`);
  return audio;
}