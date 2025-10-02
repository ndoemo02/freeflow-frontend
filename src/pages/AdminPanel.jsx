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
import { 
  getAnalyticsKPI, 
  getOrdersChartData, 
  getHourlyDistribution, 
  getTopDishes, 
  getTopRestaurants 
} from '../lib/analytics';
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

  // Ładuj dane przy pierwszym renderze i zmianie okresu
  useEffect(() => {
    const period = selectedPeriod.split(' ')[0]; // '7 dni' -> '7'
    loadAnalyticsData(period);
  }, [selectedPeriod]);

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
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false }
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
          padding: 20
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
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden animate-pulse">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : (
            kpiData.map((kpi, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="text-4xl font-extrabold text-gray-800 mb-2 flex items-baseline gap-2">
                  {kpi.value}
                  <span className="text-lg text-gray-500 font-normal">{kpi.unit}</span>
                </div>
                <div className="text-gray-600 font-medium mb-4">{kpi.label}</div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${
                  kpi.positive ? 'text-green-600' : 'text-red-600'
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
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-xl font-bold text-gray-800">Krzywa Zamówień</div>
                <div className="text-sm text-gray-500 mt-1">Trend zamówień w czasie rzeczywistym</div>
              </div>
              <div className="flex gap-2">
                {['Dzienna', 'Godzinowa', 'Tygodniowa'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-4 py-2 border rounded-full text-xs transition-all ${
                      chartType === type 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'border-gray-200 hover:border-indigo-300'
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
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="mb-8">
              <div className="text-xl font-bold text-gray-800">Rozkład Godzinowy</div>
              <div className="text-sm text-gray-500 mt-1">Kiedy jest największy ruch</div>
            </div>
            <div className="h-80">
              <Doughnut data={hourlyChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Dishes */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-xl font-bold text-gray-800 mb-6">Top Dania</div>
            {topDishes.map((dish, index) => (
              <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{dish.name}</div>
                    <div className="text-xs text-gray-500">{dish.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{dish.orders}</div>
                  <div className="text-xs text-gray-500">zamówień</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Restaurants */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-xl font-bold text-gray-800 mb-6">Top Restauracje</div>
            {topRestaurants.map((restaurant, index) => (
              <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{restaurant.name}</div>
                    <div className="text-xs text-gray-500">{restaurant.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{restaurant.revenue}</div>
                  <div className="text-xs text-gray-500">przychód</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
