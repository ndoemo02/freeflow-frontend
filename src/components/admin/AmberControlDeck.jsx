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
    model: 'gpt-5',
    streaming: true,
    cache_enabled: true,
    speech_style: 'standard',
    env: '-',
  });
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': adminToken };

  const fetchData = async () => {
    try {
      const [cfgRes, liveRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/config'), { headers }),
        fetch(getApiUrl('/api/admin/live'), { headers })
      ]);
      const cfgJson = await cfgRes.json();
      const live = await liveRes.json();
      if (cfgJson && cfgJson.ok !== false) {
        const cfg = cfgJson.config || {};
        setConfig(prev => ({
          ...prev,
          tts_engine: cfg.tts_engine?.engine || prev.tts_engine,
          tts_voice: cfg.tts_voice?.voice || prev.tts_voice,
          model: cfg.model?.name || prev.model,
          streaming: cfg.streaming?.enabled ?? prev.streaming,
          cache_enabled: cfg.cache_enabled ?? prev.cache_enabled,
          speech_style: cfg.speech_style || prev.speech_style,
          env: cfg.env || prev.env,
        }));
      }
      if (live && live.ok !== false) setLogs(live.data || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const saveConfig = async (key, value) => {
    try {
      let payloadValue = value;
      if (key === 'tts_engine') {
        payloadValue = { engine: value };
      } else if (key === 'tts_voice') {
        payloadValue = { voice: value };
      } else if (key === 'model') {
        payloadValue = { name: value };
      } else if (key === 'streaming') {
        payloadValue = { enabled: !!value };
      }

      const res = await fetch(getApiUrl('/api/admin/config'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value: payloadValue }),
      });
      const json = await res.json();
      if (json && json.ok !== false && json.config) {
        const cfg = json.config;
        setConfig(prev => ({
          ...prev,
          tts_engine: cfg.tts_engine?.engine || prev.tts_engine,
          tts_voice: cfg.tts_voice?.voice || prev.tts_voice,
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

  return (
    <div className="space-y-8">
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
            </select>
            <label className="block text-sm text-gray-300 mt-3">Głos TTS</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
              value={config.tts_voice}
              onChange={(e) => saveConfig('tts_voice', e.target.value)}
            >
              <option value="pl-PL-Wavenet-D">pl-PL-Wavenet-D</option>
              <option value="pl-PL-Chirp3-HD-Erinome">pl-PL-Chirp3-HD-Erinome</option>
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
            <label className="flex items-center justify-between text-sm text-gray-300 bg-white/5 border border-white/10 rounded px-3 py-2">
              <span>Cache aktywny</span>
              <input type="checkbox" checked={!!config.cache_enabled} onChange={(e)=>saveConfig('cache_enabled', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-gray-300 bg-white/5 border border-white/10 rounded px-3 py-2">
              <span>Streaming audio</span>
              <input type="checkbox" checked={!!config.streaming} onChange={(e)=>saveConfig('streaming', e.target.checked)} />
            </label>
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








