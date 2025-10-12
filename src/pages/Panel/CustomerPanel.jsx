import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../state/auth'
import { supabase, AmberLogger } from '../../lib/supabaseClient'
import { useToast } from '../../components/Toast'
import PanelHeader from '../../components/PanelHeader'

export default function CustomerPanel() {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user?.id) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Load profile and orders
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      
      // Load profile from auth metadata
      const profileData = {
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        city: user.user_metadata?.city || '',
        role: 'customer'
      };
      setProfile(profileData);
      AmberLogger.log("Profile loaded:", profileData);

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
          .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) AmberLogger.error(ordersError);
      else AmberLogger.log("Orders loaded:", ordersData);
      setOrders(ordersData || []);

  // Load restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants')
          .select('id,name,city')
        .order('name');

      if (restaurantsError) AmberLogger.error(restaurantsError);
      else AmberLogger.log("Restaurants loaded:", restaurantsData);
      setRestaurants(restaurantsData || []);

      setLoading(false);
    };

    loadData();

    // Realtime order updates
    const channel = supabase
      .channel(`orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          AmberLogger.log("Realtime order update:", payload);
          loadData();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        navigate('/')
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [navigate])

  const loadMenu = async (restaurantId) => {
    try {
      setLoadingMenu(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('id,name,price,description')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      
      setMenuItems(data || []);
      AmberLogger.log("Menu loaded:", data);
    } catch (e) {
      push('Błąd podczas ładowania menu', 'error');
      AmberLogger.error(e);
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  }

  const selectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    loadMenu(restaurant.id);
  }

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setSavingProfile(true);
      
      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city
        }
      });

      if (error) throw error;
      
      push('Profil został zaktualizowany', 'success');
      setEditingProfile(false);
      AmberLogger.log("Profile saved:", profile);
    } catch (e) {
      push('Błąd podczas zapisywania profilu', 'error');
      AmberLogger.error(e);
    } finally {
      setSavingProfile(false);
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      push('Zamówienie zostało anulowane', 'success')
      AmberLogger.log("Order cancelled:", { id: orderId });
      
      // Refresh orders
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (e) {
      push('Błąd podczas anulowania zamówienia', 'error')
      AmberLogger.error(e);
    }
  }

  return (
    <motion.div 
      className="min-h-screen bg-black px-4 py-8 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0">
          <div className="grid grid-cols-12 gap-4 h-full">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="relative"
                animate={{
                  opacity: [0.1, 0.8, 0.1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-transparent to-purple-500/20"
                  animate={{
                    opacity: [0, 1, 0],
                    scaleY: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500"
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    boxShadow: [
                      "0 0 5px rgba(0, 255, 255, 0.3)",
                      "0 0 20px rgba(0, 255, 255, 0.8)",
                      "0 0 5px rgba(0, 255, 255, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Navigation Buttons */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between">
          <motion.button
            onClick={() => navigate('/')}
            className="rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-slate-300 hover:bg-white/10 transition-all backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            ← Strona główna
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/')}
            className="rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-slate-300 hover:bg-white/10 transition-all backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            ✕ Zamknij panel
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Panel Klienta
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-300 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Zarządzaj swoim kontem, zamówieniami i ustawieniami
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <StatsCards orders={orders} />
        </motion.div>

        <motion.div 
          className="mb-6 flex gap-2 overflow-x-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TabButton current={tab} setTab={setTab} id="profile" icon="🙋">Profil</TabButton>
          <TabButton current={tab} setTab={setTab} id="orders" icon="📋">Zamówienia</TabButton>
          <TabButton current={tab} setTab={setTab} id="restaurants" icon="🍕">Restauracje</TabButton>
          <TabButton current={tab} setTab={setTab} id="settings" icon="⚙️">Ustawienia</TabButton>
        </motion.div>

        <motion.div 
          className="rounded-2xl border border-cyan-500/20 bg-black/40 backdrop-blur-xl p-6 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 255, 255, 0.05))',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <AnimatePresence mode="wait">
            {tab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileTab
                  profile={profile}
                  user={user}
                  editing={editingProfile}
                  setEditing={setEditingProfile}
                  saving={savingProfile}
                  saveProfile={saveProfile}
                  setProfile={setProfile}
                />
              </motion.div>
            )}
            {tab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <OrdersTab orders={orders} loading={loading} cancelOrder={cancelOrder} />
              </motion.div>
            )}
            {tab === 'restaurants' && (
              <motion.div
                key="restaurants"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RestaurantsTab 
                  restaurants={restaurants} 
                  selectedRestaurant={selectedRestaurant}
                  menuItems={menuItems}
                  loadingMenu={loadingMenu}
                  onSelectRestaurant={selectRestaurant}
                  onBack={() => setSelectedRestaurant(null)}
                />
              </motion.div>
            )}
            {tab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  )
}

function TabButton({ current, setTab, id, icon, children }) {
  const active = current === id
  return (
    <motion.button 
      onClick={() => setTab(id)} 
      className={[
        'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all whitespace-nowrap backdrop-blur-xl',
        active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white shadow-lg border border-cyan-500/30' : 'bg-black/40 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-500/20'
      ].join(' ')}
      whileHover={{ 
        scale: 1.05,
        y: -2,
        boxShadow: active ? "0 0 25px rgba(0, 255, 255, 0.4)" : "0 0 15px rgba(0, 255, 255, 0.2)",
        transition: { type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <span>{icon}</span>
        {children}
    </motion.button>
  )
}

function ProfileTab({ profile, user, editing, setEditing, saving, saveProfile, setProfile }) {
  if (!profile) return <div className="text-slate-300">Ładowanie profilu…</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Profil użytkownika</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button 
                onClick={() => setEditing(false)} 
                className="rounded-xl border border-white/20 bg-glass px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10" 
                disabled={saving}
              >
                Anuluj
              </button>
              <button 
                onClick={saveProfile} 
                disabled={saving} 
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditing(true)} 
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
            >
              Edytuj profil
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EditableField 
          label="Imię" 
          value={profile.first_name || ""} 
          editing={editing}
          onChange={(value) => setProfile(prev => ({ ...prev, first_name: value }))}
        />
        <EditableField 
          label="Nazwisko" 
          value={profile.last_name || ""} 
          editing={editing}
          onChange={(value) => setProfile(prev => ({ ...prev, last_name: value }))}
        />
        <Field label="Email" value={profile.email || "Nie podano"} full readOnly />
        <EditableField 
          label="Telefon" 
          value={profile.phone || ""} 
          editing={editing}
          onChange={(value) => setProfile(prev => ({ ...prev, phone: value }))}
          placeholder="+48 123 456 789"
        />
        <EditableField 
          label="Adres" 
          value={profile.address || ""} 
          editing={editing}
          onChange={(value) => setProfile(prev => ({ ...prev, address: value }))}
          placeholder="ul. Przykładowa 123/45"
          full
        />
        <EditableField 
          label="Miasto" 
          value={profile.city || ""} 
          editing={editing}
          onChange={(value) => setProfile(prev => ({ ...prev, city: value }))}
          placeholder="Warszawa"
        />
        <Field label="Rola" value={profile.role || "customer"} />
        </div>
              </div>
  )
}

function Field({ label, value, full, readOnly }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className={`rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 ${readOnly ? 'opacity-60' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function EditableField({ label, value, editing, onChange, placeholder, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      {editing ? (
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className="w-full rounded-xl border border-cyan-500/30 bg-black/40 px-4 py-3 text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-xl"
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100">
          {value || <span className="text-slate-500">{placeholder || "Nie podano"}</span>}
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders, loading, cancelOrder }) {
  if (loading) return <div className="text-center text-slate-400 py-8">Ładowanie zamówień...</div>;
  if (orders.length === 0) return <div className="text-center text-slate-400 py-12"><div className="text-4xl mb-4">📦</div><p>Nie masz jeszcze żadnych zamówień</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Historia zamówień</h2>
        <div className="space-y-4">
          {orders.map(order => (
          <motion.div 
              key={order.id} 
            className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                  Zamówienie #{order.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-slate-400">
                  {new Date(order.created_at).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  </p>
                </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-300">
                Kwota: {Number(order.total_price || 0).toFixed(2)} zł
                  </div>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                  onClick={() => {
                        if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
                          cancelOrder(order.id)
                        }
                      }}
                      className="px-3 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
          </motion.div>
          ))}
        </div>
            </div>
  )
}

function RestaurantsTab({ restaurants, selectedRestaurant, menuItems, loadingMenu, onSelectRestaurant, onBack }) {
  if (selectedRestaurant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-slate-300 hover:bg-white/10 transition-colors"
          >
            ← Wróć
          </button>
          <h2 className="text-xl font-bold text-white">{selectedRestaurant.name}</h2>
        </div>
        
        {loadingMenu ? (
          <div className="text-center text-slate-400 py-8">Ładowanie menu...</div>
        ) : menuItems.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Brak pozycji w menu</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {menuItems.map((item, index) => (
              <motion.div 
                key={item.id} 
                className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  boxShadow: "0 20px 40px rgba(0, 255, 255, 0.2)"
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{item.name}</h4>
                  <span className="text-cyan-400 font-bold">{Number(item.price).toFixed(2)} zł</span>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-400">{item.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Dostępne restauracje</h2>
      <p className="text-slate-400">Kliknij na restaurację, aby zobaczyć menu</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant, index) => (
          <motion.div 
            key={restaurant.id}
            className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 backdrop-blur-xl cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 20px 40px rgba(0, 255, 255, 0.2)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRestaurant(restaurant)}
          >
            <h3 className="font-semibold text-white mb-2">{restaurant.name}</h3>
            <p className="text-sm text-slate-400 mb-3">{restaurant.city}</p>
            <div className="text-xs text-cyan-400">Kliknij, aby zobaczyć menu →</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Ustawienia</h2>
      <div className="text-slate-300">
        Powiadomienia push i preferencje — wkrótce.
          </div>
    </div>
  )
}

function getStatusClass(status) {
  switch(status) {
    case 'delivered': return 'bg-green-600/20 text-green-500 border-green-600/30'
    case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

function getStatusText(status) {
  switch(status) {
    case 'delivered': return 'Dostarczone'
    case 'completed': return 'Gotowe do odbioru'
    case 'preparing': return 'W przygotowaniu'
    case 'pending': return 'Oczekiwanie'
    case 'cancelled': return 'Anulowane'
    default: return 'Nieznany'
  }
}

function StatsCards({ orders }) {
  const totalOrders = orders.filter(o => o.status !== 'cancelled').length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  const stats = [
    {
      title: "Wszystkich zamówień",
      value: totalOrders,
      icon: "📦",
      gradient: "from-orange-500/25 to-orange-500/10",
      borderColor: "border-orange-500/30"
    },
    {
      title: "Ukończonych",
      value: completedOrders,
      icon: "✅",
      gradient: "from-emerald-500/25 to-emerald-500/10",
      borderColor: "border-emerald-500/30"
    },
    {
      title: "Łączna kwota",
      value: `${totalSpent.toFixed(2)} zł`,
      icon: "💰",
      gradient: "from-purple-500/25 to-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    {
      title: "W trakcie",
      value: pendingOrders,
      icon: "⏳",
      gradient: "from-cyan-500/25 to-cyan-500/10",
      borderColor: "border-cyan-500/30"
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard 
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          gradient={stat.gradient}
          borderColor={stat.borderColor}
          index={index}
        />
      ))}
    </div>
  )
}

function StatCard({ title, value, icon, gradient, borderColor, index }) {
  return (
    <motion.div 
      className={`rounded-2xl border ${borderColor} bg-black/40 backdrop-blur-xl p-6 transition-all hover:scale-105 shadow-2xl`}
            whileHover={{ 
              scale: 1.05,
        y: -5,
        boxShadow: "0 20px 40px rgba(0, 255, 255, 0.2)",
        transition: { type: "spring", stiffness: 300 }
            }}
            whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
            transition={{ 
        type: "spring", 
        stiffness: 200,
        delay: index * 0.1
      }}
      style={{
        background: `linear-gradient(135deg, ${gradient.includes('orange') ? 'rgba(249, 115, 22, 0.1)' : gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' : gradient.includes('purple') ? 'rgba(168, 85, 247, 0.1)' : 'rgba(6, 182, 212, 0.1)'}, rgba(0, 0, 0, 0.3))`,
        borderColor: borderColor.includes('orange') ? 'rgba(249, 115, 22, 0.3)' : borderColor.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : borderColor.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : 'rgba(6, 182, 212, 0.3)'
      }}
    >
      <div className="flex items-center justify-between">
                  <div>
          <motion.p 
            className="text-sm font-medium text-slate-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {title}
          </motion.p>
          <motion.p 
            className="text-2xl font-bold text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.3 + index * 0.1, 
              type: "spring", 
              stiffness: 200 
            }}
          >
            {value}
          </motion.p>
                  </div>
          <motion.div 
          className="text-2xl opacity-80"
              animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
            repeatType: "reverse",
            delay: index * 0.2
          }}
        >
          {icon}
          </motion.div>
    </div>
    </motion.div>
  )
}
