import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  getAnalyticsKPI,
  getOrdersChartData,
  getHourlyDistribution,
  getTopDishes,
  getTopRestaurants
} from '../lib/analytics';
import { supabase } from '../lib/supabase';
import PanelHeader from '../components/PanelHeader';
import { CONFIG, getApiUrl } from '../lib/config';
import AmberControlDeck from '../components/admin/AmberControlDeck';
import AmberLiveMonitor from '../components/AmberLiveMonitor';
import FreeFunNearby from '../components/FreeFunNearby';
import FreeFunSection from '../components/FreeFunSection';
// Galaxy UI Components
import GalaxyBackground from '../components/galaxy/GalaxyBackground';
import KPICard from '../components/galaxy/KPICard';
import GlassCard from '../components/galaxy/GlassCard';
import GalaxyChart from '../components/galaxy/GalaxyChart';
import AmberDiagnostics from '../components/galaxy/AmberDiagnostics';
import AlertsList from '../components/galaxy/AlertsList';
import TopList from '../components/galaxy/TopList';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
);

import { useTheme } from '../state/ThemeContext';

export default function AdminPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('7 dni');
  const [chartType, setChartType] = useState('Dzienna');
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  // Admin token
  const [adminToken, setAdminToken] = useState('');
  useEffect(() => {
    const t = localStorage.getItem('admin-token') || '';
    setAdminToken(t);
  }, []);
  const saveToken = (v) => { setAdminToken(v); localStorage.setItem('admin-token', v || ''); };
  const tokenOk = !!adminToken;

  // State dla danych z Supabase
  const [analyticsData, setAnalyticsData] = useState(null);
  const [ordersChart, setOrdersChart] = useState(null);
  const [hourlyChart, setHourlyChart] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Admin API states
  const [intents, setIntents] = useState([]);
  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => (new Date()).toISOString().slice(0, 10));
  const [intentFilter, setIntentFilter] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', available: true });

  // Amber Diagnostics
  const [diag, setDiag] = useState({ nluMs: 0, dbMs: 0, ttsMs: 0, durationMs: 0, lastAt: null, running: false });
  const testAmber = async () => {
    try {
      setDiag(d => ({ ...d, running: true }));
      const t0 = performance.now();
      const resp = await fetch(getApiUrl('/api/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Gdzie mogę zjeść w pobliżu?', includeTTS: true, sessionId: `diag-${Date.now()}` })
      });
      const json = await resp.json();
      const t1 = performance.now();
      const timings = json.timings || {};
      setDiag({
        nluMs: Math.round(timings.nluMs || 0),
        dbMs: Math.round(timings.dbMs || 0),
        ttsMs: Math.round(timings.ttsMs || 0),
        durationMs: Math.round(timings.durationMs || (t1 - t0)),
        lastAt: new Date().toISOString(),
        running: false,
      });
    } catch (e) {
      console.warn('Amber test failed', e);
      setDiag(d => ({ ...d, running: false }));
    }
  };

  // Heartbeat
  const [hb, setHb] = useState({ status: 'unknown', last: null });
  useEffect(() => {
    let timer;
    const tick = async () => {
      try {
        const r = await fetch(getApiUrl('/api/health'));
        setHb({ status: r.ok ? '🟢 online' : '🔴 offline', last: new Date().toISOString() });
      } catch {
        setHb({ status: '🔴 offline', last: new Date().toISOString() });
      }
    };
    tick();
    timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, []);

  // Live diagnostics via SSE
  useEffect(() => {
    try {
      const es = new EventSource(getApiUrl('/api/amber/live'));
      es.onmessage = (e) => {
        try {
          const j = JSON.parse(e.data || '{}');
          setDiag(d => ({
            nluMs: Math.round(j.nlu_ms ?? j.nluMs ?? d.nluMs),
            dbMs: Math.round(j.db_ms ?? j.dbMs ?? d.dbMs),
            ttsMs: Math.round(j.tts_ms ?? j.ttsMs ?? d.ttsMs),
            durationMs: Math.round(j.duration_ms ?? j.durationMs ?? d.durationMs),
            lastAt: j.created_at || new Date().toISOString(),
            running: false,
          }));
        } catch { }
      };
      return () => es.close();
    } catch {
      // ignore if EventSource not supported
    }
  }, []);

  // Trends & Top slow intents
  const [trends, setTrends] = useState([]);
  const [topSlow, setTopSlow] = useState([]);
  const [debugStatus, setDebugStatus] = useState("");
  const [debugMsg, setDebugMsg] = useState("");
  const [activity, setActivity] = useState([]);
  const [bizStats, setBizStats] = useState({ total_orders: 0, total_revenue: 0, avg_order: 0, interactions: 0, conversion: 0 });
  const [alerts, setAlerts] = useState([]);
  // Amber Learning Stats
  const [learningStats, setLearningStats] = useState({ total: 0, latest: [], intentStats: {}, feedbackStats: { positive: 0, negative: 0, neutral: 0 } });
  const [learningLoading, setLearningLoading] = useState(false);
  // Tabs
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'control' | 'learning'

  // Date helper that accepts YYYY-MM-DD and DD.MM.YYYY
  const toIsoSafe = (v, endOfDay = false) => {
    if (!v) return null;
    let d = null;
    if (v instanceof Date) d = v;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) d = new Date(v);
    else if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(v))) {
      const [dd, mm, yyyy] = String(v).split('.');
      d = new Date(`${yyyy}-${mm}-${dd}`);
    }
    if (!d || isNaN(d.getTime())) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  const loadTrends = async () => {
    if (!tokenOk) return setTrends([]);
    try {
      const qs = new URLSearchParams();
      const fIso = toIsoSafe(fromDate);
      const tIso = toIsoSafe(toDate, true);
      if (fIso) qs.append('from', fIso);
      if (tIso) qs.append('to', tIso);
      if (intentFilter) qs.append('intent', intentFilter);
      const j = await adminFetch(`/api/admin/performance/trends?${qs.toString()}`);
      setTrends(j.data || []);
    } catch (e) {
      console.warn('trends error', e.message);
      setTrends([]);
    }
  };
  const loadTopSlow = async () => {
    if (!tokenOk) return setTopSlow([]);
    try {
      const qs = new URLSearchParams();
      const fIso = toIsoSafe(fromDate);
      const tIso = toIsoSafe(toDate, true);
      if (fIso) qs.append('from', fIso);
      if (tIso) qs.append('to', tIso);
      if (intentFilter) qs.append('intent', intentFilter);
      const j = await adminFetch(`/api/admin/performance/top-intents?${qs.toString()}`);
      setTopSlow(j.data || []);
    } catch (e) {
      console.warn('top-intents error', e.message);
      setTopSlow([]);
    }
  };

  useEffect(() => {
    if (!tokenOk) return;
    loadTrends();
    loadTopSlow();
    loadActivity();
    loadBusiness();
    fetchAlerts();
    loadLearningStats();
  }, [tokenOk, fromDate, toDate, intentFilter]);

  const refreshData = async () => {
    await Promise.all([loadIntents(), loadTrends(), loadTopSlow(), loadActivity(), loadBusiness()]);
  };

  const trendsData = {
    labels: trends.map(t => t.day),
    datasets: [
      { label: 'NLU', data: trends.map(t => t.nluAvg), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.2)', tension: 0.3 },
      { label: 'DB', data: trends.map(t => t.dbAvg), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.2)', tension: 0.3 },
      { label: 'TTS', data: trends.map(t => t.ttsAvg), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.2)', tension: 0.3 },
      { label: 'Total', data: trends.map(t => t.durAvg), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', tension: 0.3 },
    ]
  };
  const trendsOptions = { responsive: true, plugins: { legend: { labels: { color: '#e5e7eb' } } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } };

  const adminFetch = async (url, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', 'x-admin-token': adminToken, ...(opts.headers || {}) };
    const fullUrl = /^https?:/i.test(url) ? url : getApiUrl(url.startsWith('/') ? url : `/${url}`);
    const res = await fetch(fullUrl, { ...opts, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const loadActivity = async () => {
    if (!tokenOk) return setActivity([]);
    try {
      const j = await adminFetch('/api/admin/amber/restaurants-activity?days=7');
      setActivity(j.data || []);
    } catch (e) { setActivity([]); }
  };
  const loadBusiness = async () => {
    if (!tokenOk) return setBizStats({ total_orders: 0, total_revenue: 0, avg_order: 0, interactions: 0, conversion: 0 });
    try {
      const j = await adminFetch('/api/admin/business/stats');
      setBizStats({
        total_orders: j.total_orders || 0,
        total_revenue: j.total_revenue || 0,
        avg_order: j.avg_order || 0,
        interactions: j.interactions || 0,
        conversion: j.conversion || 0,
      });
    } catch (e) { }
  };
  const fetchAlerts = async () => {
    if (!tokenOk) return setAlerts([]);
    try {
      const j = await adminFetch('/api/admin/trends/alerts');
      setAlerts(j.alerts || j.data || []);
    } catch (e) { setAlerts([]); }
  };

  const loadLearningStats = async (limit = 20) => {
    if (!tokenOk) return;
    setLearningLoading(true);
    try {
      const j = await adminFetch(`/api/admin/amber/learning-stats?limit=${limit}`);
      setLearningStats({
        total: j.total || 0,
        latest: j.latest || [],
        intentStats: j.intentStats || {},
        feedbackStats: j.feedbackStats || { positive: 0, negative: 0, neutral: 0 }
      });
    } catch (e) {
      console.warn('learning-stats error', e.message);
      setLearningStats({ total: 0, latest: [], intentStats: {}, feedbackStats: { positive: 0, negative: 0, neutral: 0 } });
    } finally {
      setLearningLoading(false);
    }
  };

  const loadIntents = async () => {
    if (!tokenOk) return setIntents([]);
    try {
      const qs = new URLSearchParams();
      const fIso = toIsoSafe(fromDate);
      const tIso = toIsoSafe(toDate, true);
      if (fIso) qs.append('from', fIso);
      if (tIso) qs.append('to', tIso);
      if (intentFilter) qs.append('intent', intentFilter);
      const j = await adminFetch(`/api/admin/intents?${qs.toString()}`);
      setIntents(j.data || []);
    } catch (e) {
      console.warn('intents error', e.message);
      setIntents([]);
    }
  };

  const loadRestaurants = async () => {
    if (!tokenOk) return setRestaurants([]);
    try {
      const j = await adminFetch('/api/admin/restaurants');
      setRestaurants(j.data || []);
    } catch (e) {
      console.warn('restaurants error', e.message);
      setRestaurants([]);
    }
  };

  const loadMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setMenuItems([]);
    if (!restaurant) return;
    try {
      const j = await adminFetch(`/api/admin/menu?restaurant_id=${restaurant.id}`);
      setMenuItems(j.data || []);
    } catch (e) {
      console.warn('menu error', e.message);
      setMenuItems([]);
    }
  };

  const saveMenuItem = async () => {
    if (!selectedRestaurant) return;
    const payload = { ...newItem, restaurant_id: selectedRestaurant.id, price: Number(newItem.price) || 0 };
    try {
      await adminFetch('/api/admin/menu', { method: 'POST', body: JSON.stringify(payload) });
      setShowAddModal(false);
      setNewItem({ name: '', price: '', category: '', available: true });
      await loadMenu(selectedRestaurant);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  // Funkcja do ładowania wszystkich danych
  const loadAnalyticsData = async (period = '7') => {
    setLoading(true);
    try {
      const now = new Date();
      const fromIso = toIsoSafe(fromDate) || new Date(now.getTime() - (parseInt(period) || 7) * 24 * 60 * 60 * 1000).toISOString();
      const toIso = toIsoSafe(toDate, true) || now.toISOString();
      console.log('📊 Zakres dat:', { from: fromIso, to: toIso });

      // Przelicz na dni dla istniejących helperów
      const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
      const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));

      const [kpi, orders, hourly, dishes, restaurantsTop] = await Promise.all([
        getAnalyticsKPI(String(days)),
        getOrdersChartData(String(days)),
        getHourlyDistribution(),
        getTopDishes(),
        getTopRestaurants()
      ]);

      setAnalyticsData(kpi);
      setOrdersChart(orders);
      setHourlyChart(hourly);
      setTopDishes(dishes);
      setTopRestaurants(restaurantsTop);
    } catch (error) {
      console.error('❌ loadAnalyticsData error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do ładowania kont użytkowników
  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          user_type,
          business_id,
          created_at,
          first_name,
          last_name,
          phone
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        // Fallback to mock data when database is empty
        setAccounts(getMockAccounts());
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Fallback to mock data
      setAccounts(getMockAccounts());
    } finally {
      setAccountsLoading(false);
    }
  };

  // Ładuj dane przy pierwszym renderze i zmianie okresu
  useEffect(() => {
    const period = selectedPeriod.split(' ')[0]; // '7 dni' -> '7'
    loadAnalyticsData(period);
    loadAccounts();
    loadIntents();
    loadRestaurants();
  }, [selectedPeriod, tokenOk]);

  // Funkcja do określania typu konta
  const getAccountType = (userType) => {
    switch (userType) {
      case 'business': return { label: 'BIZ', color: 'bg-blue-600 text-blue-100', icon: '🏢' };
      case 'customer': return { label: 'CUS', color: 'bg-green-600 text-green-100', icon: '👤' };
      case 'admin': return { label: 'ADM', color: 'bg-red-600 text-red-100', icon: '👑' };
      case 'driver': return { label: 'DRV', color: 'bg-yellow-600 text-yellow-100', icon: '🚗' };
      default: return { label: 'UNK', color: 'bg-gray-600 text-gray-100', icon: '❓' };
    }
  };

  // Mock dane dla kont użytkowników
  const getMockAccounts = () => [
    {
      id: 'mock-1',
      email: 'jan.kowalski@example.com',
      user_type: 'customer',
      first_name: 'Jan',
      last_name: 'Kowalski',
      phone: '123456789',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-2',
      email: 'anna.nowak@restaurant.com',
      user_type: 'business',
      first_name: 'Anna',
      last_name: 'Nowak',
      phone: '987654321',
      business_id: 'biz-1',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-3',
      email: 'admin@freeflow.com',
      user_type: 'admin',
      first_name: 'Admin',
      last_name: 'System',
      phone: '555666777',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-4',
      email: 'kierowca@taxi.com',
      user_type: 'driver',
      first_name: 'Piotr',
      last_name: 'Kierowca',
      phone: '111222333',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Przygotuj dane KPI dla wyświetlenia
  const kpiData = analyticsData ? [
    {
      value: analyticsData.totalRevenue.toLocaleString('pl-PL'),
      unit: 'zł',
      label: 'Całkowity Przychód',
      change: `${analyticsData.revenueChange >= 0 ? '+' : ''}${analyticsData.revenueChange.toFixed(1)}% vs poprzedni okres`,
      positive: analyticsData.revenueChange >= 0
    },
    {
      value: analyticsData.totalOrders.toLocaleString('pl-PL'),
      unit: 'zamówień',
      label: 'Liczba Zamówień',
      change: `${analyticsData.ordersChange >= 0 ? '+' : ''}${analyticsData.ordersChange.toFixed(1)}% vs poprzedni okres`,
      positive: analyticsData.ordersChange >= 0
    },
    {
      value: analyticsData.averageOrderValue.toFixed(2),
      unit: 'zł',
      label: 'Średnia Wartość Zamówienia',
      change: `${analyticsData.avgOrderChange >= 0 ? '+' : ''}${analyticsData.avgOrderChange.toFixed(1)}% vs poprzedni okres`,
      positive: analyticsData.avgOrderChange >= 0
    },
    {
      value: analyticsData.customerSatisfaction.toFixed(1),
      unit: '%',
      label: 'Zadowolenie Klientów',
      change: `${analyticsData.satisfactionChange >= 0 ? '+' : ''}${analyticsData.satisfactionChange.toFixed(1)}% vs poprzedni okres`,
      positive: analyticsData.satisfactionChange >= 0
    }
  ] : [];

  // Dane wykresu zamówień (z Supabase lub fallback)
  const ordersChartData = ordersChart ? {
    labels: ordersChart.labels,
    datasets: [{
      label: 'Liczba zamówień',
      data: ordersChart.values,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 3,
      pointRadius: 6
    }]
  } : {
    labels: ['Ładowanie...'],
    datasets: [{ label: 'Ładowanie...', data: [0], borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.1)' }]
  };

  // Dane wykresu godzinowego (z Supabase lub fallback)
  const hourlyChartData = hourlyChart ? {
    labels: hourlyChart.labels,
    datasets: [{
      data: hourlyChart.values,
      backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#e2e8f0'],
      borderWidth: 0
    }]
  } : {
    labels: ['Ładowanie...'],
    datasets: [{ data: [100], backgroundColor: ['#e2e8f0'] }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF' }
      }
    },
    elements: {
      point: { hoverRadius: 8 }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#9CA3AF'
        }
      },
      tooltip: { enabled: true }
    }
  };

  // Intents chart data
  const intentsChartData = {
    labels: intents.map(i => new Date(i.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Confidence',
      data: intents.map(i => i.confidence ?? 0),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }]
  };
  const intentsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const i = intents[ctx.dataIndex];
            return `${i.intent} • ${i.confidence?.toFixed?.(2) ?? '-'}\n${(i.replySnippet || '').slice(0, 60)}`;
          }
        }
      },
      legend: { display: false }
    },
    scales: { y: { beginAtZero: true, max: 1 } }
  };

  const fallbackBlocks = intents.filter(i => i.fallback && (i.confidence ?? 1) < 0.5).slice(0, 10);

  const diagData = {
    labels: ['NLU parse', 'DB fetch', 'TTS gen'],
    datasets: [{
      label: 'ms',
      data: [diag.nluMs, diag.dbMs, diag.ttsMs],
      backgroundColor: ['#22d3ee', '#f59e0b', '#8b5cf6']
    }]
  };
  const diagOptions = { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw} ms` } } } };

  // Loading state UI
  if (loading && !analyticsData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
        <GalaxyBackground />
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-4 border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <h2 className="mt-8 text-xl font-space tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse">
          INITIALIZING AMBER...
        </h2>
      </div>
    );
  }

  // Tabs configuration
  const TABS = [
    { id: 'insights', label: 'Insights', icon: 'ChartLineUp' },
    { id: 'control', label: 'Control Deck', icon: 'Faders' },
    { id: 'amber', label: 'Amber AI', icon: 'Robot' },
    { id: 'learning', label: 'Learning', icon: 'Brain' },
    { id: 'ui-config', label: 'UI Config', icon: 'Gear' },
  ];

  const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--space-black)' }}>
      <GalaxyBackground />
      <div className="relative z-10 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Galaxy Header */}
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <i className="ph ph-planet text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-space tracking-tight text-white">
                  FreeFlow <span className="text-purple-400">Admin</span>
                </h1>
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  System Operational
                </p>
              </div>
            </div>
            {/* Search & User */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Ask Amber..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 focus:outline-none text-sm text-white placeholder-gray-500 transition-all"
                />
              </div>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all">
                <i className="ph ph-bell text-gray-300"></i>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" className="w-full h-full" />
                </div>
              </div>
            </div>
          </header>

          {/* Admin Token Input */}
          <div className="flex items-center gap-3 mb-6">
            <input
              value={adminToken}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="x-admin-token"
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white w-80 focus:border-cyan-500/50 focus:outline-none"
            />
            <span className={`text-sm ${tokenOk ? 'text-green-400' : 'text-red-400'}`}>
              {tokenOk ? 'Połączono jako Admin ✅' : 'Brak tokenu ❌'}
            </span>
          </div>

          {/* Admin token */}
          <div className="flex items-center gap-3 mb-6">
            <input
              value={adminToken}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="x-admin-token"
              className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white w-80"
            />
            <span className={`text-sm ${tokenOk ? 'text-green-400' : 'text-red-400'}`}>
              {tokenOk ? 'Połączono jako Admin ✅' : 'Brak tokenu ❌'}
            </span>
          </div>

          {/* Galaxy Tabs */}
          <nav className="mb-8 overflow-x-auto">
            <div className="glass-panel inline-flex p-1.5 rounded-xl">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'learning') loadLearningStats();
                  }}
                  className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {activeTab === tab.id && (
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg opacity-80 -z-10"></span>
                  )}
                  <i className={`ph ph-${toKebabCase(tab.icon)} text-lg`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {activeTab === 'ui-config' ? (
            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-6">🎨 UI Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Theme Version</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTheme('v1')}
                      className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all ${theme === 'v1'
                          ? 'border-blue-500 bg-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <div className="text-2xl mb-2">🏛️</div>
                      <div className="font-bold">Classic (v1)</div>
                      <div className="text-sm opacity-70">Standardowy interfejs</div>
                    </button>

                    <button
                      onClick={() => setTheme('v2')}
                      className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all ${theme === 'v2'
                          ? 'border-cyan-500 bg-cyan-500/20 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <div className="text-2xl mb-2">🔮</div>
                      <div className="font-bold">Ultra Modern (v2)</div>
                      <div className="text-sm opacity-70">Holographic / Neon / Glass</div>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Preview</h3>
                  <div className={`w-full h-40 rounded-lg flex items-center justify-center border ${theme === 'v2'
                      ? 'border-cyan-500/50 bg-black shadow-[inset_0_0_30px_rgba(6,182,212,0.2)]'
                      : 'border-gray-600 bg-gray-800'
                    }`}>
                    {theme === 'v2' ? (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-cyan-500 shadow-[0_0_20px_#06b6d4] animate-pulse"></div>
                        <span className="text-cyan-400 font-mono text-sm">SYSTEM ONLINE</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-300">System Online</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'control' ? (
            <AmberControlDeck adminToken={adminToken} />
          ) : activeTab === 'learning' ? (
            <>
              {/* Amber Self-Learning Dashboard */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">🧠 Amber Self-Learning</h2>
                    <p className="text-gray-300">System uczenia maszynowego - analiza feedbacku i adaptacja intencji</p>
                  </div>
                  <button
                    onClick={() => loadLearningStats()}
                    disabled={learningLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg"
                  >
                    {learningLoading ? 'Ładowanie...' : '🔄 Odśwież'}
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-lg border border-purple-500/30">
                    <div className="text-sm text-purple-200 mb-2">Całkowite rekordy</div>
                    <div className="text-3xl font-bold text-white">{learningStats.total}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 shadow-lg border border-green-500/30">
                    <div className="text-sm text-green-200 mb-2">Pozytywny feedback</div>
                    <div className="text-3xl font-bold text-white">{learningStats.feedbackStats.positive}</div>
                    <div className="text-xs text-green-200 mt-1">
                      {learningStats.total > 0 ? ((learningStats.feedbackStats.positive / learningStats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 shadow-lg border border-red-500/30">
                    <div className="text-sm text-red-200 mb-2">Negatywny feedback</div>
                    <div className="text-3xl font-bold text-white">{learningStats.feedbackStats.negative}</div>
                    <div className="text-xs text-red-200 mt-1">
                      {learningStats.total > 0 ? ((learningStats.feedbackStats.negative / learningStats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-6 shadow-lg border border-gray-500/30">
                    <div className="text-sm text-gray-200 mb-2">Neutralny feedback</div>
                    <div className="text-3xl font-bold text-white">{learningStats.feedbackStats.neutral}</div>
                    <div className="text-xs text-gray-200 mt-1">
                      {learningStats.total > 0 ? ((learningStats.feedbackStats.neutral / learningStats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Feedback Distribution Chart */}
                <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                  <div className="text-xl font-bold text-white mb-6">Rozkład Feedbacku</div>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: ['Pozytywny', 'Negatywny', 'Neutralny'],
                        datasets: [{
                          data: [
                            learningStats.feedbackStats.positive,
                            learningStats.feedbackStats.negative,
                            learningStats.feedbackStats.neutral
                          ],
                          backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
                          borderWidth: 0
                        }]
                      }}
                      options={doughnutOptions}
                    />
                  </div>
                </div>

                {/* Intent Statistics */}
                <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                  <div className="text-xl font-bold text-white mb-6">Statystyki Intencji</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(learningStats.intentStats || {}).map(([intent, count]) => (
                      <div key={intent} className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">{intent}</div>
                        <div className="text-2xl font-bold text-white">{count}</div>
                      </div>
                    ))}
                    {Object.keys(learningStats.intentStats || {}).length === 0 && (
                      <div className="col-span-full text-gray-400 text-center py-8">Brak danych</div>
                    )}
                  </div>
                </div>

                {/* Latest Learning Records */}
                <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xl font-bold text-white">Ostatnie rekordy uczenia</div>
                    <select
                      onChange={(e) => loadLearningStats(parseInt(e.target.value))}
                      className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded"
                      defaultValue="20"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-gray-300 border-b border-gray-700">
                          <th className="py-3 px-4">Intencja</th>
                          <th className="py-3 px-4">Feedback</th>
                          <th className="py-3 px-4">Tekst wejściowy</th>
                          <th className="py-3 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learningStats.latest.map((record, idx) => (
                          <tr key={idx} className="border-b border-gray-700 hover:bg-gray-900/50">
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm">
                                {record.intent || 'unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {record.feedback_score === 1 ? (
                                <span className="text-green-400">✓ Pozytywny</span>
                              ) : record.feedback_score === 0 ? (
                                <span className="text-red-400">✗ Negatywny</span>
                              ) : (
                                <span className="text-gray-400">— Neutralny</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-300 text-sm">
                              {record.input_text || '—'}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {record.created_at ? new Date(record.created_at).toLocaleString('pl-PL') : '—'}
                            </td>
                          </tr>
                        ))}
                        {learningStats.latest.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400">
                              {learningLoading ? 'Ładowanie...' : 'Brak rekordów uczenia'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Period Controls */}
              <div className="flex justify-center gap-4 items-center mb-8">
                <button
                  onClick={() => loadAnalyticsData(selectedPeriod.split(' ')[0])}
                  disabled={loading}
                  className="px-4 py-2 bg-white/10 border border-orange-400/30 rounded-full hover:bg-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-orange-200"
                  title="Odśwież dane"
                >
                  🔄 {loading ? 'Ładowanie...' : 'Odśwież'}
                </button>
                {['Dziś', '7 dni', '30 dni', '90 dni'].map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    disabled={loading}
                    className={`px-5 py-2 border border-orange-400/30 rounded-full transition-all ${selectedPeriod === period
                      ? 'bg-orange-500/20 border-orange-400/50 text-orange-200'
                      : 'bg-white/10 hover:bg-white/15 text-white/80'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              {/* Galaxy KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                {loading ? (
                  Array(4).fill(0).map((_, index) => (
                    <div key={index} className="glass-panel rounded-2xl p-6 animate-pulse">
                      <div className="h-10 bg-gray-700/30 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
                    </div>
                  ))
                ) : kpiData.length > 0 ? (
                  <>
                    <KPICard
                      title="Total Revenue"
                      value={parseFloat(analyticsData.totalRevenue) || 0}
                      prefix="$"
                      subtext={`daily avg $${((parseFloat(analyticsData.totalRevenue) || 0) / 7).toFixed(1)}k`}
                      trend={analyticsData.revenueChange || 0}
                      icon="CurrencyDollar"
                      color="purple"
                    />
                    <KPICard
                      title="Active Orders"
                      value={parseInt(analyticsData.totalOrders) || 0}
                      subtext="85 pending dispatch"
                      trend={analyticsData.ordersChange || 0}
                      icon="ShoppingCart"
                      color="cyan"
                    />
                    <KPICard
                      title="Amber Interventions"
                      value={428}
                      subtext="94% auto-resolved"
                      trend={-2.4}
                      icon="Robot"
                      color="pink"
                    />
                    <KPICard
                      title="Customer Rating"
                      value={parseFloat(analyticsData.customerSatisfaction) || 4.9}
                      subtext="based on 12k reviews"
                      trend={analyticsData.satisfactionChange || 0}
                      icon="Star"
                      color="blue"
                    />
                  </>
                ) : (
                  Array(4).fill(0).map((_, index) => (
                    <div key={index} className="glass-panel rounded-2xl p-6">
                      <div className="text-gray-400">No data</div>
                    </div>
                  ))
                )}
              </div>

              {/* Galaxy Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Orders Chart */}
                <GlassCard className="lg:col-span-2 h-[400px]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white font-space">Order Trends</h2>
                    <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none">
                      <option>Last 24 Hours</option>
                      <option>Last 7 Days</option>
                      <option>Last Month</option>
                    </select>
                  </div>
                  {ordersChart ? (
                    <GalaxyChart
                      type="line"
                      data={{
                        labels: ordersChart.labels || [],
                        datasets: [{
                          label: 'Today',
                          data: ordersChart.values || [],
                        }, {
                          label: 'Yesterday',
                          data: (ordersChart.values || []).map(v => v * 0.8),
                        }]
                      }}
                      height={300}
                    />
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-400">Loading chart...</div>
                  )}
                </GlassCard>

                {/* Secondary Stats */}
                <div className="space-y-6">
                  <TopList dishes={topDishes} restaurants={topRestaurants} />
                  <AlertsList alerts={alerts} />
                </div>
              </div>

              {/* Amber Diagnostics & Demographics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <AmberDiagnostics metrics={{
                  cpu: 45,
                  nlu: diag.nluMs > 0 ? Math.min(100, 100 - (diag.nluMs / 10)) : 98,
                  sentiment: 85,
                  latency: diag.durationMs || 120
                }} />
                <GlassCard glowColor="purple" className="lg:col-span-2 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  <h3 className="text-gray-300 font-medium mb-4">User Demographics</h3>
                  <div className="flex items-center justify-center h-48 relative">
                    {hourlyChart ? (
                      <GalaxyChart
                        type="doughnut"
                        data={{
                          labels: hourlyChart.labels || ['Mobile', 'Desktop', 'Tablet'],
                          datasets: [{
                            data: hourlyChart.values || [65, 25, 10],
                            backgroundColor: ['#00f5ff', '#8b5cf6', '#ec4899'],
                            borderWidth: 0,
                            hoverOffset: 4
                          }]
                        }}
                        height={200}
                      />
                    ) : (
                      <div className="text-gray-400">Loading...</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">12k</div>
                        <div className="text-xs text-gray-400">Users</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div>
                      <div className="text-cyan-400 font-bold">65%</div>
                      <div className="text-xs text-gray-500">Mobile</div>
                    </div>
                    <div>
                      <div className="text-purple-400 font-bold">25%</div>
                      <div className="text-xs text-gray-500">Desktop</div>
                    </div>
                    <div>
                      <div className="text-pink-400 font-bold">10%</div>
                      <div className="text-xs text-gray-500">Tablet</div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Krzywa Intencji Amber */}
              <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold text-white">Krzywa Intencji Amber</div>
                    <div className="text-sm text-gray-300">Confidence w czasie (ostatnie {intents.length}) · <span className="ml-1">{hb.status}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={loadIntents} className="px-4 py-2 bg-white/10 border border-purple-400/40 text-purple-200 rounded-lg">Odśwież</button>
                    <button onClick={testAmber} disabled={diag.running} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg">{diag.running ? 'TEST...' : 'TEST AMBER'}</button>
                    <button onClick={() => {
                      const qs = new URLSearchParams();
                      qs.append('token', adminToken);
                      const fIso = toIsoSafe(fromDate);
                      const tIso = toIsoSafe(toDate, true);
                      if (fIso) qs.append('from', fIso);
                      if (tIso) qs.append('to', tIso);
                      if (intentFilter) qs.append('intent', intentFilter);
                      window.open(getApiUrl(`/api/admin/intents/export?${qs.toString()}`));
                    }} disabled={!tokenOk} className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg">⬇️ Eksport CSV</button>
                  </div>
                </div>
                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Od</div>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Do</div>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Intencja</div>
                    <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded">
                      <option value="">Wszystkie</option>
                      <option value="create_order">create_order</option>
                      <option value="find_nearby">find_nearby</option>
                      <option value="confirm_order">confirm_order</option>
                      <option value="cancel_order">cancel_order</option>
                      <option value="select_restaurant">select_restaurant</option>
                      <option value="menu_request">menu_request</option>
                    </select>
                  </div>
                  <button onClick={refreshData} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded">🔄 Odśwież</button>
                </div>
                <div className="h-72 mb-8">
                  <Line data={intentsChartData} options={intentsChartOptions} />
                </div>
                {/* Amber Diagnostics bars */}
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">Amber Diagnostics</div>
                    <div className="text-sm text-gray-400">Całkowity: {diag.durationMs} ms {diag.lastAt && `• ${new Date(diag.lastAt).toLocaleTimeString()}`}</div>
                  </div>
                  <div className="h-48">
                    <Bar data={diagData} options={diagOptions} />
                  </div>
                  <div className="text-xs text-gray-300 mt-2">NLU parse {diag.nluMs}ms | DB fetch {diag.dbMs}ms | TTS gen {diag.ttsMs}ms</div>
                </div>
                <div className="mt-4">
                  <AmberLiveMonitor />
                </div>
              </div>

              {/* Trendy: Średnia latencja / dzień */}
              <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xl font-bold text-white">Średnia latencja / dzień</div>
                  <button onClick={loadTrends} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
                </div>
                <div className="h-72">
                  <Line data={trendsData} options={trendsOptions} />
                </div>
              </div>

              {/* Top 5 najwolniejszych intencji */}
              <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xl font-bold text-white">Top 5 najwolniejszych intencji</div>
                  <button onClick={loadTopSlow} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
                </div>
                <div className="space-y-2">
                  {topSlow.map((r, i) => (
                    <div key={r.intent + i} className="flex items-center justify-between text-white/90 border-b border-gray-700 py-2">
                      <div className="flex items-center gap-2"><span>{i === 0 ? '🐢' : i === 1 ? '⚙️' : i === 2 ? '🐌' : '⏳'}</span><span className="font-semibold">{r.intent}</span></div>
                      <div className="text-gray-300">{r.avgMs} ms</div>
                    </div>
                  ))}
                  {topSlow.length === 0 && <div className="text-gray-400 text-sm">Brak danych</div>}
                </div>
              </div>

              {/* Aktywność Ambera wg restauracji */}
              <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xl font-bold text-white">Aktywność Ambera wg restauracji</div>
                  <div className="flex gap-2">
                    <button onClick={loadActivity} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
                    <button onClick={async () => { try { await adminFetch('/api/admin/trends/analyze', { method: 'POST' }); await Promise.all([loadActivity(), loadBusiness()]); } catch (e) { } }} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded">Analizuj teraz</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {activity.map((r, i) => (
                    <div key={r.id + i} className="flex items-center justify-between text-white/90 border-b border-gray-700 py-2">
                      <div>{r.name}</div>
                      <div className="text-gray-300">{r.interactions} interakcji</div>
                    </div>
                  ))}
                  {activity.length === 0 && <div className="text-gray-400 text-sm">Brak danych</div>}
                </div>
              </div>

              {/* FreeFlow Business Pulse */}
              <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
                <div className="text-xl font-bold text-white mb-6">FreeFlow Business Pulse</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                    <div className="text-sm text-gray-400">Całkowity przychód</div>
                    <div className="text-2xl text-white font-bold">{bizStats.total_revenue.toFixed(2)} zł</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                    <div className="text-sm text-gray-400">Liczba zamówień</div>
                    <div className="text-2xl text-white font-bold">{bizStats.total_orders}</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                    <div className="text-sm text-gray-400">Średnia wartość</div>
                    <div className="text-2xl text-white font-bold">{bizStats.avg_order.toFixed(2)} zł</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                    <div className="text-sm text-gray-400">Konwersja</div>
                    <div className="text-2xl text-white font-bold">{(bizStats.conversion * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">{bizStats.interactions} interakcji</div>
                  </div>
                </div>
              </div>

              {/* Amber Alerts */}
              <div className="p-6 bg-slate-900 rounded-2xl border border-gray-700 text-white mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">⚠️ Amber Alerts</h3>
                  <button onClick={fetchAlerts} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded">Odśwież</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-300">
                        <th className="py-2 text-left">Typ</th>
                        <th className="py-2 text-left">Poziom</th>
                        <th className="py-2 text-left">Treść</th>
                        <th className="py-2 text-left">Czas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(alerts || []).map((a, i) => (
                        <tr key={(a.id || i)} className="border-t border-gray-700">
                          <td className="py-2">{a.type}</td>
                          <td className="py-2">{a.severity}</td>
                          <td className="py-2">{a.message}</td>
                          <td className="py-2">{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                      {(!alerts || alerts.length === 0) && (
                        <tr><td colSpan={4} className="py-3 text-gray-400">Brak alertów</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FreeFun Nearby */}
              <FreeFunNearby />

              {/* FreeFun Section - Zaawansowany widok wydarzeń */}
              <div className="mt-8">
                <FreeFunSection />
              </div>

              {/* Control Deck przeniesiony do osobnego komponentu i zakładki */}

              {/* Restauracje & Menu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
                  <div className="text-xl font-bold text-white mb-4">🍽️ Restauracje</div>
                  <ol className="space-y-2 list-decimal list-inside text-white/90">
                    {restaurants.map((r, idx) => (
                      <li key={r.id} className="flex items-center justify-between gap-3">
                        <button onClick={() => loadMenu(r)} className="text-left hover:text-purple-300">
                          {r.name}
                          <span className="text-xs text-gray-400 ml-2">({r.partner_mode})</span>
                        </button>
                        <span className="text-xs text-gray-400">menu: {r.menu_count}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-white">Menu: {selectedRestaurant?.name || '—'}</div>
                    <button disabled={!selectedRestaurant} onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg">➕ Add Item</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-300">
                          <th className="py-2">Name</th>
                          <th className="py-2">Price</th>
                          <th className="py-2">Category</th>
                          <th className="py-2">Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map(m => (
                          <tr key={m.id} className="border-t border-gray-700 text-white/90">
                            <td className="py-2">{m.name}</td>
                            <td className="py-2">{Number(m.price).toFixed(2)} zł</td>
                            <td className="py-2">{m.category || '—'}</td>
                            <td className="py-2">{m.available ? '✓' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Debug Card */}
              <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 mt-6">
                <div className="text-xl font-bold text-white mb-3">🧠 Debug Info</div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="font-semibold text-white">Token:</span> {adminToken ? (adminToken.slice(0, 20) + '****') : 'Brak'}</p>
                  <p><span className="font-semibold text-white">Status:</span> {debugStatus || 'Nie testowano'}</p>
                  <p><span className="font-semibold text-white">Odpowiedź:</span> {debugMsg || 'Brak danych'}</p>
                </div>
                <div>
                  <button
                    className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                    onClick={async () => {
                      setDebugStatus('Łączenie...');
                      const start = performance.now();
                      try {
                        const res = await fetch(getApiUrl('/api/admin/restaurants'), { headers: { 'x-admin-token': adminToken } });
                        const data = await res.json();
                        const end = (performance.now() - start).toFixed(1);
                        setDebugStatus(`HTTP ${res.status} (${end}ms)`);
                        setDebugMsg(JSON.stringify(data).slice(0, 250) + '...');
                      } catch (err) {
                        setDebugStatus('❌ Błąd połączenia');
                        setDebugMsg(err.message);
                      }
                    }}
                  >Testuj Połączenie</button>
                </div>
              </div>

            </>
          )}

          {/* Modal Add Item */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                <div className="text-white font-bold text-lg mb-4">Dodaj pozycję</div>
                <div className="space-y-3">
                  <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                  <input value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} placeholder="Price" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                  <input value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} placeholder="Category" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                  <label className="flex items-center gap-2 text-white/80 text-sm">
                    <input type="checkbox" checked={newItem.available} onChange={e => setNewItem({ ...newItem, available: e.target.checked })} /> Available
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setShowAddModal(false)} className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white">Anuluj</button>
                  <button onClick={saveMenuItem} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">💾 Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Ostatnie blokady Amber */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 mb-12">
            <div className="text-xl font-bold text-white mb-4">⚠️ Ostatnie blokady Amber</div>
            <div className="space-y-2">
              {fallbackBlocks.length === 0 ? (
                <div className="text-gray-400 text-sm">Brak blokad w ostatnich zapisach</div>
              ) : (
                fallbackBlocks.map((b, i) => (
                  <div key={i} className="text-sm text-white/90 flex items-center justify-between border-b border-gray-700 py-2">
                    <div>
                      <div className="font-semibold">{b.intent} • {(b.confidence ?? 0).toFixed(2)}</div>
                      <div className="text-gray-400">{(b.replySnippet || '').slice(0, 80)}</div>
                    </div>
                    <div className="text-gray-400">{new Date(b.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Dishes */}
            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
              <div className="text-xl font-bold text-white mb-6">Top Dania</div>
              {topDishes.map((dish, index) => (
                <div key={index} className="flex justify-between items-center py-4 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{dish.name}</div>
                      <div className="text-xs text-gray-300">{dish.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{dish.orders}</div>
                    <div className="text-xs text-gray-300">zamówień</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Restaurants */}
            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
              <div className="text-xl font-bold text-white mb-6">Top Restauracje</div>
              {topRestaurants.map((restaurant, index) => (
                <div key={index} className="flex justify-between items-center py-4 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{restaurant.name}</div>
                      <div className="text-xs text-gray-300">{restaurant.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{restaurant.revenue}</div>
                    <div className="text-xs text-gray-300">przychód</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Management Section */}
          <motion.div
            className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Server Accounts</h2>
                <p className="text-gray-300">Manage user accounts and roles</p>
              </div>
              <button
                onClick={loadAccounts}
                disabled={accountsLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                {accountsLoading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {accountsLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-16 bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">👥</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No accounts found</h3>
                    <p className="text-gray-300">No user accounts registered yet</p>
                  </div>
                ) : (
                  accounts.map((account, index) => {
                    const accountType = getAccountType(account.user_type);
                    return (
                      <motion.div
                        key={account.id}
                        className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600 hover:shadow-lg transition-all duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xl">{accountType.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {account.first_name || 'Brak'} {account.last_name || 'nazwiska'}
                              </h3>
                              <p className="text-gray-300 text-sm">{account.email}</p>
                              {account.phone && (
                                <p className="text-gray-400 text-xs">📞 {account.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${accountType.color}`}>
                              {accountType.label}
                            </span>
                            <div className="text-right">
                              <div className="text-sm text-gray-300">
                                Joined: {new Date(account.created_at).toLocaleDateString()}
                              </div>
                              {account.business_id && (
                                <div className="text-xs text-gray-400">
                                  Business ID: {account.business_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
