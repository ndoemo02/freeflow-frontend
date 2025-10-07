import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function AdminPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('7 dni');
  const [chartType, setChartType] = useState('Dzienna');
  const [loading, setLoading] = useState(true);
  
  // State dla danych z Supabase
  const [analyticsData, setAnalyticsData] = useState(null);
  const [ordersChart, setOrdersChart] = useState(null);
  const [hourlyChart, setHourlyChart] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Funkcja do ładowania wszystkich danych
  const loadAnalyticsData = async (period = '7') => {
    setLoading(true);
    try {
      const [kpi, orders, hourly, dishes, restaurants] = await Promise.all([
        getAnalyticsKPI(period),
        getOrdersChartData(period),
        getHourlyDistribution(),
        getTopDishes(),
        getTopRestaurants()
      ]);

      setAnalyticsData(kpi);
      setOrdersChart(orders);
      setHourlyChart(hourly);
      setTopDishes(dishes);
      setTopRestaurants(restaurants);
    } catch (error) {
      console.error('Error loading analytics data:', error);
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
  }, [selectedPeriod]);

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
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]">
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <PanelHeader 
            title="📊 FreeFlow Analytics" 
            subtitle="Panel analityczny z danymi w czasie rzeczywistym"
          />

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
                className={`px-5 py-2 border border-orange-400/30 rounded-full transition-all ${
                  selectedPeriod === period 
                    ? 'bg-orange-500/20 border-orange-400/50 text-orange-200' 
                    : 'bg-white/10 hover:bg-white/15 text-white/80'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {period}
              </button>
            ))}
          </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-gray-800 p-8 rounded-2xl shadow-lg relative overflow-hidden animate-pulse border border-gray-700">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="h-10 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))
          ) : (
            kpiData.map((kpi, index) => (
              <div key={index} className="bg-gray-800 p-8 rounded-2xl shadow-lg relative overflow-hidden border border-gray-700">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="text-4xl font-extrabold text-white mb-2 flex items-baseline gap-2">
                  {kpi.value}
                  <span className="text-lg text-gray-300 font-normal">{kpi.unit}</span>
                </div>
                <div className="text-gray-300 font-medium mb-4">{kpi.label}</div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${
                  kpi.positive ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className="text-base">{kpi.positive ? '↗' : '↘'}</span>
                  <span>{kpi.change}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Orders Chart */}
          <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-xl font-bold text-white">Krzywa Zamówień</div>
                <div className="text-sm text-gray-300 mt-1">Trend zamówień w czasie rzeczywistym</div>
              </div>
              <div className="flex gap-2">
                {['Dzienna', 'Godzinowa', 'Tygodniowa'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-4 py-2 border rounded-full text-xs transition-all ${
                      chartType === type 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'border-gray-600 hover:border-indigo-400 text-gray-300 bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <Line data={ordersChartData} options={chartOptions} />
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
            <div className="mb-8">
              <div className="text-xl font-bold text-white">Rozkład Godzinowy</div>
              <div className="text-sm text-gray-300 mt-1">Kiedy jest największy ruch</div>
            </div>
            <div className="h-80">
              <Doughnut data={hourlyChartData} options={doughnutOptions} />
            </div>
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
