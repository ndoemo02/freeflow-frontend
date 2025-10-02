import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../state/auth';
import { useToast } from '../../components/Toast';
import PanelHeader from '../../components/PanelHeader';

export default function TaxiPanel() {
  const { user } = useAuth();
  const { push } = useToast();
  
  const [driverStatus, setDriverStatus] = useState('offline'); // offline, available, busy
  const [bookings, setBookings] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    todayRides: 0,
    totalEarnings: 0,
    rating: 0
  });

  // Load driver data
  useEffect(() => {
    loadDriverData();
    loadBookings();
    loadStats();
  }, [user]);

  // Real-time location tracking
  useEffect(() => {
    if (driverStatus === 'available' || driverStatus === 'busy') {
      startLocationTracking();
    }
    return () => stopLocationTracking();
  }, [driverStatus]);

  const loadDriverData = async () => {
    try {
      const { data, error } = await supabase
        .from('taxi_drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setDriverStatus(data.status);
        setCurrentLocation({ lat: data.lat, lng: data.lng });
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!customer_id(
            first_name,
            last_name,
            phone
          )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, actual_price, created_at')
        .eq('driver_id', user.id);
      
      if (data) {
        const totalRides = data.filter(b => b.status === 'completed').length;
        const todayRides = data.filter(b => 
          b.status === 'completed' && 
          new Date(b.created_at).toDateString() === new Date().toDateString()
        ).length;
        const totalEarnings = data
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.actual_price || 0), 0);
        
        setStats({ totalRides, todayRides, totalEarnings, rating: 4.8 });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateDriverStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('taxi_drivers')
        .upsert({
          user_id: user.id,
          status: newStatus,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setDriverStatus(newStatus);
      push(`Status zmieniony na: ${getStatusText(newStatus)}`, 'success');
    } catch (error) {
      push('Błąd aktualizacji statusu', 'error');
    }
  };

  const acceptBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      setDriverStatus('busy');
      await updateDriverStatus('busy');
      loadBookings();
      push('Kurs zaakceptowany!', 'success');
    } catch (error) {
      push('Błąd akceptacji kursu', 'error');
    }
  };

  const completeBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      setDriverStatus('available');
      await updateDriverStatus('available');
      loadBookings();
      loadStats();
      push('Kurs ukończony!', 'success');
    } catch (error) {
      push('Błąd ukończenia kursu', 'error');
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Update location in database
          supabase
            .from('taxi_drivers')
            .upsert({
              user_id: user.id,
              lat: latitude,
              lng: longitude,
              updated_at: new Date().toISOString()
            });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
      );
    }
  };

  const stopLocationTracking = () => {
    // Stop geolocation tracking
  };

  const getStatusText = (status) => {
    const statusMap = {
      offline: 'Offline',
      available: 'Dostępny',
      busy: 'Na kursie'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      offline: 'bg-gray-500',
      available: 'bg-green-500',
      busy: 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const getBookingStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-500',
      accepted: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <PanelHeader 
          title="Panel Kierowcy Taxi" 
          subtitle="Zarządzaj kursami i statusem"
        />

        {/* Status Control */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status Kierowcy</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(driverStatus)}`}></div>
            <span className="text-lg">{getStatusText(driverStatus)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateDriverStatus('available')}
              disabled={driverStatus === 'available'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              🟢 Dostępny
            </button>
            <button
              onClick={() => updateDriverStatus('busy')}
              disabled={driverStatus === 'busy'}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              🔴 Na kursie
            </button>
            <button
              onClick={() => updateDriverStatus('offline')}
              disabled={driverStatus === 'offline'}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              ⚫ Offline
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Dzisiaj</h3>
            <p className="text-2xl font-bold">{stats.todayRides}</p>
            <p className="text-gray-400 text-sm">kursów</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Wszystkie</h3>
            <p className="text-2xl font-bold">{stats.totalRides}</p>
            <p className="text-gray-400 text-sm">kursów</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Zarobki</h3>
            <p className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)} zł</p>
            <p className="text-gray-400 text-sm">łącznie</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Ocena</h3>
            <p className="text-2xl font-bold">{stats.rating}</p>
            <p className="text-gray-400 text-sm">⭐</p>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Kursy</h2>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Brak kursów</p>
            ) : (
              bookings.map(booking => (
                <div key={booking.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        📞 {booking.customer?.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getBookingStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className="text-lg font-bold">{booking.actual_price || booking.estimated_price} zł</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">Z:</p>
                      <p className="font-medium">{booking.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Do:</p>
                      <p className="font-medium">{booking.destination_address}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => acceptBooking(booking.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      >
                        ✅ Akceptuj
                      </button>
                    )}
                    {booking.status === 'accepted' && (
                      <button
                        onClick={() => completeBooking(booking.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        🏁 Ukończ
                      </button>
                    )}
                    <button
                      onClick={() => {/* Show details */}}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      📋 Szczegóły
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
