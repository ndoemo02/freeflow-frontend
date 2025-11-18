import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getApiUrl } from '../../lib/config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AmberControlDeck({ adminToken }) {
  const [config, setConfig] = useState({
    tts_engine: 'vertex',
    tts_voice: 'pl-PL-Wavenet-D',
    tts_tone: 'swobodny',
    tts_pitch: 0,
    tts_rate: 1.0,
    model: 'gpt-5',
    streaming: true,
    cache_enabled: true,
    speech_style: 'standard',
    env: '-',
  });
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aliases, setAliases] = useState({});
  const [aliasForm, setAliasForm] = useState({ alias: '', canonical: '' });
  const [aliasSaving, setAliasSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': adminToken };

  const fetchData = async () => {
    try {
      const [cfgRes, liveRes, aliasRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/config'), { headers }),
        fetch(getApiUrl('/api/admin/live'), { headers }),
        fetch(getApiUrl('/api/admin/aliases'), { headers })
      ]);
      const cfgJson = await cfgRes.json();
      const live = await liveRes.json();
      const aliasJson = await aliasRes.json().catch(() => ({ ok: false }));
      if (cfgJson && cfgJson.ok !== false) {
        const cfg = cfgJson.config || {};
        setConfig(prev => ({
          ...prev,
          tts_engine: cfg.tts_engine?.engine || prev.tts_engine,
          tts_voice: cfg.tts_voice?.voice || prev.tts_voice,
          tts_tone: cfg.tts_tone || prev.tts_tone,
          tts_pitch: typeof cfg.tts_pitch === 'number' ? cfg.tts_pitch : prev.tts_pitch,
          tts_rate: typeof cfg.tts_rate === 'number' ? cfg.tts_rate : prev.tts_rate,
          model: cfg.model?.name || prev.model,
          streaming: cfg.streaming?.enabled ?? prev.streaming,
          cache_enabled: cfg.cache_enabled ?? prev.cache_enabled,
          speech_style: cfg.speech_style || prev.speech_style,
          env: cfg.env || prev.env,
        }));
      }
      if (live && live.ok !== false) setLogs(live.data || []);
      if (aliasJson && aliasJson.ok !== false) setAliases(aliasJson.aliases || {});
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const saveConfig = async (key, value) => {
    try {
      let payloadValue = value;
      let apiKey = key;
      if (key === 'tts_engine') {
        payloadValue = { engine: value };
      } else if (key === 'tts_voice') {
        payloadValue = { voice: value };
      } else if (key === 'tts_tone') {
        apiKey = 'tts_tone';
        payloadValue = value;
      } else if (key === 'tts_pitch' || key === 'tts_rate') {
        apiKey = key;
        payloadValue = Number(value);
      } else if (key === 'model') {
        payloadValue = { name: value };
      } else if (key === 'streaming') {
        payloadValue = { enabled: !!value };
      }

      const res = await fetch(getApiUrl('/api/admin/config'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: apiKey, value: payloadValue }),
      });
      const json = await res.json();
      if (json && json.ok !== false && json.config) {
        const cfg = json.config;
        setConfig(prev => ({
          ...prev,
          tts_engine: cfg.tts_engine?.engine || prev.tts_engine,
          tts_voice: cfg.tts_voice?.voice || prev.tts_voice,
          tts_tone: cfg.tts_tone || prev.tts_tone,
          tts_pitch: typeof cfg.tts_pitch === 'number' ? cfg.tts_pitch : prev.tts_pitch,
          tts_rate: typeof cfg.tts_rate === 'number' ? cfg.tts_rate : prev.tts_rate,
          model: cfg.model?.name || prev.model,
          streaming: cfg.streaming?.enabled ?? prev.streaming,
          cache_enabled: cfg.cache_enabled ?? prev.cache_enabled,
          speech_style: cfg.speech_style || prev.speech_style,
          env: cfg.env || prev.env,
        }));
      } else {
        // optimistic local update as fallback
        setConfig(prev => ({ ...prev, [key]: value }));
      }
    } catch {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const fetchPrompt = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/prompt'), { headers });
      const json = await res.json();
      setPrompt(json.prompt || json.content || '');
    } catch { setPrompt(''); }
  };

  const savePrompt = async () => {
    try {
      await fetch(getApiUrl('/api/admin/prompt'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt }),
      });
    } catch (e) {
      alert('Prompt save failed: ' + e.message);
    }
  };

  useEffect(() => {
    if (!adminToken) return;
    fetchData();
    fetchPrompt();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, [adminToken]);

  const rolling = (logs || []).slice(0, 20).map(l => l.durationMs);
  const rollingData = {
    labels: rolling.map((_, i) => `#${i + 1}`),
    datasets: [
      {
        label: 'durationMs',
        data: rolling,
        borderColor: '#9b87f5',
        backgroundColor: 'rgba(155,135,245,0.2)',
        tension: 0.35
      }
    ]
  };
  const rollingOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } };

  if (loading) return <div className="text-center text-gray-400">Ładowanie panelu…</div>;

  const aliasEntries = Object.entries(aliases || {});

  const handleAliasSubmit = async () => {
    if (!aliasForm.alias.trim() || !aliasForm.canonical.trim()) return;
    setAliasSaving(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/aliases'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alias: aliasForm.alias.trim(),
          canonical: aliasForm.canonical.trim()
        })
      });
      const json = await res.json();
      if (json && json.ok !== false) {
        setAliases(json.aliases || {});
        setAliasForm({ alias: '', canonical: '' });
      } else {
        alert(json?.error || 'Alias save failed');
      }
    } catch (e) {
      alert('Alias save failed: ' + e.message);
    } finally {
      setAliasSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Problemy z intencjami (fallback/niska pewność) */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">🧪 Problemy do przejrzenia</div>
          <button onClick={fetchData} className="px-2 py-1 text-xs bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
        </div>
        <div className="overflow-y-auto max-h-60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-300 border-b border-gray-700">
                <th className="py-2">Intent</th>
                <th className="py-2">Conf.</th>
                <th className="py-2">Fallback</th>
                <th className="py-2">Odpowiedź</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).filter(l => (l?.fallback === true) || ((l?.confidence ?? 1) < 0.6)).map((l, i) => (
                <tr key={`p-${i}`} className="border-t border-gray-700 text-white/90">
                  <td className="py-2">{l.intent}</td>
                  <td className="py-2">{l.confidence != null ? Number(l.confidence).toFixed(2) : '-'}</td>
                  <td className="py-2">{String(!!l.fallback)}</td>
                  <td className="py-2 truncate max-w-[28ch]">{l.replySnippet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Ustawienia Systemu */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-semibold text-lg">⚙️ Ustawienia Systemu</div>
          <div className="text-sm text-gray-400">Env: {config.env || '-'}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">Engine TTS</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
              value={config.tts_engine}
              onChange={(e) => saveConfig('tts_engine', e.target.value)}
            >
              <option value="basic">Basic (Wavenet)</option>
              <option value="vertex">Vertex</option>
              <option value="chirp">Chirp</option>
              <option value="gemini-tts">Gemini 2.5 Pro TTS</option>
              <option value="gemini-live">Gemini Live (eksperymentalnie)</option>
            </select>
            <label className="block text-sm text-gray-300 mt-3">Głos TTS</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
              value={config.tts_voice}
              onChange={(e) => saveConfig('tts_voice', e.target.value)}
            >
              <option value="pl-PL-Wavenet-D">pl-PL-Wavenet-D</option>
              <option value="pl-PL-Wavenet-A">pl-PL-Wavenet-A</option>
              <option value="pl-PL-Wavenet-B">pl-PL-Wavenet-B</option>
              <option value="pl-PL-Wavenet-C">pl-PL-Wavenet-C</option>
              <option value="pl-PL-Standard-A">pl-PL-Standard-A</option>
              <option value="pl-PL-Standard-B">pl-PL-Standard-B</option>
              <option value="pl-PL-Chirp3-HD-Erinome">pl-PL-Chirp3-HD-Erinome</option>
              <option value="zephyr">Gemini: Zephyr (Female)</option>
              <option value="achernar">Gemini: Achernar (Female)</option>
              <option value="aoede">Gemini: Aoede (Female)</option>
              <option value="erinome">Gemini: Erinome (Female)</option>
            </select>

            <label className="block text-sm text-gray-300 mt-3">Styl językowy</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
              value={config.speech_style}
              onChange={(e) => saveConfig('speech_style', e.target.value)}
            >
              <option value="standard">Standardowy polski</option>
              <option value="silesian">Śląska gwara (gōdka)</option>
            </select>
          </div>
          <div className="space-y-4">
            <div className="space-y-2 bg-white/5 border border-white/10 rounded px-3 py-2">
              <label className="block text-sm text-gray-300 mb-1">Ton głosu (TTS)</label>
              <select
                className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
                value={config.tts_tone}
                onChange={(e) => saveConfig('tts_tone', e.target.value)}
              >
                <option value="swobodny">Swobodny</option>
                <option value="formalny">Formalny</option>
                <option value="neutralny">Neutralny</option>
              </select>
              <label className="block text-xs text-gray-400 mt-2">Pitch (–10 … 10)</label>
              <input
                type="number"
                min={-10}
                max={10}
                step={0.5}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white rounded text-sm"
                value={config.tts_pitch}
                onChange={(e) => saveConfig('tts_pitch', e.target.value)}
              />
              <label className="block text-xs text-gray-400 mt-2">Tempo mówienia (0.5 … 2.0)</label>
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.05}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white rounded text-sm"
                value={config.tts_rate}
                onChange={(e) => saveConfig('tts_rate', e.target.value)}
              />
            </div>
            <label className="flex items-center justify-between text-sm text-gray-300 bg-white/5 border border-white/10 rounded px-3 py-2">
              <span>Cache aktywny</span>
              <input type="checkbox" checked={!!config.cache_enabled} onChange={(e)=>saveConfig('cache_enabled', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-gray-300 bg-white/5 border border-white/10 rounded px-3 py-2">
              <span>Streaming audio</span>
              <input type="checkbox" checked={!!config.streaming} onChange={(e)=>saveConfig('streaming', e.target.checked)} />
            </label>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-white font-semibold mb-2">➕ Dodaj alias restauracji</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white"
                placeholder="Alias (np. rezydencja)"
                value={aliasForm.alias}
                onChange={(e)=>setAliasForm(prev=>({ ...prev, alias: e.target.value }))}
              />
              <input
                className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white"
                placeholder="Pełna nazwa (np. Rezydencja Luxury Hotel)"
                value={aliasForm.canonical}
                onChange={(e)=>setAliasForm(prev=>({ ...prev, canonical: e.target.value }))}
              />
              <button
                onClick={handleAliasSubmit}
                disabled={aliasSaving}
                className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white"
              >
                {aliasSaving ? 'Zapisywanie…' : 'Zapisz alias'}
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-300 space-y-1 max-h-32 overflow-y-auto">
              {aliasEntries.length === 0 && <div className="text-gray-500">Brak aliasów</div>}
              {aliasEntries.map(([alias, canonical]) => (
                <div key={alias} className="flex justify-between gap-3 border-b border-white/5 pb-1">
                  <span className="text-white">{alias}</span>
                  <span className="text-gray-400 text-right truncate">
                    {Array.isArray(canonical) ? canonical.join(', ') : canonical}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live log + Rolling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-white font-semibold mb-3">📡 Ostatnie interakcje Amber</div>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-300 border-b border-gray-700">
                  <th className="py-2">Intent</th>
                  <th className="py-2">Confidence</th>
                  <th className="py-2">Czas</th>
                  <th className="py-2">Odpowiedź</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const ms = l.durationMs || 0;
                  const color = ms <= 2000 ? 'text-green-400' : ms <= 5000 ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <tr key={i} className="border-t border-gray-700 text-white/90">
                      <td className="py-2">{l.intent}</td>
                      <td className="py-2">{l.confidence != null ? Number(l.confidence).toFixed(2) : '-'}</td>
                      <td className={`py-2 ${color}`}>{(ms/1000).toFixed(1)}s</td>
                      <td className="py-2 truncate max-w-[24ch]">{l.replySnippet}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-semibold">📈 Wydajność (ostatnie 20)</div>
            <button onClick={fetchData} className="px-2 py-1 text-xs bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
          </div>
          <div className="h-48">
            <Line data={rollingData} options={rollingOptions} />
          </div>
        </div>
      </div>

      {/* Prompt editor */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">🪄 Prompt stylizacji GPT-4o</div>
          <button onClick={savePrompt} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">💾 Zapisz prompt</button>
        </div>
        <textarea
          value={prompt}
          onChange={(e)=>setPrompt(e.target.value)}
          className="w-full h-40 px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
          placeholder="Wklej prompt..."
        />
      </div>
    </div>
  );
}








