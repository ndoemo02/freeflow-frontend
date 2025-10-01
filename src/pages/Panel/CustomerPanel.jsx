import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'

export default function CustomerPanel(){
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('profile')

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Order system states
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) {
          setProfile({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
          })
        }
      } catch {}
    })()
  }, [user?.id])

  // Load restaurants
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    const loadRestaurants = async () => {
      setLoadingRestaurants(true)
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id,name,city')
          .order('name')
        if (!alive) return
        if (error) throw error
        setRestaurants(data || [])
      } catch (e) {
        console.error('Error loading restaurants:', e)
      } finally {
        setLoadingRestaurants(false)
      }
    }
    loadRestaurants()
    return () => { alive = false }
  }, [user?.id])

  // Load menu items when restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) { setMenuItems([]); return }
    let alive = true
    const loadMenu = async () => {
      setLoadingMenu(true)
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('id,name,price')
          .eq('restaurant_id', selectedRestaurant)
          .order('name')
        if (!alive) return
        if (error) throw error
        setMenuItems(data || [])
      } catch (e) {
        console.error('Error loading menu:', e)
      } finally {
        setLoadingMenu(false)
      }
    }
    loadMenu()
    return () => { alive = false }
  }, [selectedRestaurant])

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

  async function saveProfile(){
    try{
      setSaving(true)
      const { error } = await supabase.from('user_profiles').upsert({
        id: user?.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      push('Profil został zaktualizowany', 'success')
      setEditing(false)
    } catch(e){
      push('Błąd podczas zapisywania profilu', 'error')
    } finally { setSaving(false) }
  }

  // Cart functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id)
      if (existing) {
        return prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const placeOrder = async () => {
    if (cart.length === 0) {
      push('Koszyk jest pusty', 'error')
      return
    }
    if (!selectedRestaurant) {
      push('Wybierz restaurację', 'error')
      return
    }

    try {
      setPlacingOrder(true)
      const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant)
      
      const { error } = await supabase.from('orders').insert({
        customer: user.id,
        restaurant: selectedRestaurant,
        status: 'pending',
        total: getCartTotal(),
        items: JSON.stringify(cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })))
      })

              if (error) throw error
              
              push('Zamówienie zostało złożone!', 'success')
              setCart([])
              setSelectedRestaurant('')
              
              // Odśwież statystyki i zamówienia
              setRefreshTrigger(prev => prev + 1)
    } catch (e) {
      push('Błąd podczas składania zamówienia', 'error')
      console.error('Order error:', e)
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center relative">
          <button
            onClick={() => navigate('/')}
            className="absolute top-0 right-0 w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-colors"
            title="Zamknij panel (ESC)"
          >
            ✕
          </button>
          <h1 className="mb-2 text-4xl font-bold text-white">Panel Klienta</h1>
          <p className="text-lg text-slate-400">Zarządzaj swoim kontem, zamówieniami i ustawieniami</p>
        </div>

                <CustomerStats userId={user?.id} refreshTrigger={refreshTrigger} />

        <div className="mb-6 flex gap-2 overflow-x-auto">
          <TabButton current={tab} setTab={setTab} id="profile" icon="🙋">Profil</TabButton>
          <TabButton current={tab} setTab={setTab} id="order" icon="🍕">Zamów jedzenie</TabButton>
          <TabButton current={tab} setTab={setTab} id="orders" icon="📋">Zamówienia</TabButton>
          <TabButton current={tab} setTab={setTab} id="settings" icon="⚙️">Ustawienia</TabButton>
        </div>

        <div className="rounded-2xl border border-white/10 bg-glass backdrop-blur-xs p-6">
          {tab === 'profile' && (
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              editing={editing}
              setEditing={setEditing}
              saving={saving}
              saveProfile={saveProfile}
              user={user}
            />
          )}
          {tab === 'order' && (
            <OrderTab
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              setSelectedRestaurant={setSelectedRestaurant}
              menuItems={menuItems}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              getCartTotal={getCartTotal}
              placeOrder={placeOrder}
              placingOrder={placingOrder}
              loadingRestaurants={loadingRestaurants}
              loadingMenu={loadingMenu}
            />
          )}
                  {tab === 'orders' && <OrdersTab userId={user?.id} refreshTrigger={refreshTrigger} />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}

function CustomerStats({ userId, refreshTrigger }){
  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, totalSpent: 0 })
  const [loading, setLoading] = useState(true)
  useEffect(() => { if (userId) load() }, [userId, refreshTrigger])
  async function load(){
    try{
      const { data, error } = await supabase
        .from('orders')
        .select('status,total')
        .eq('customer', userId)
      if (error) throw error
      const totalOrders = (data || []).filter(o => o.status !== 'cancelled').length
      const completedOrders = (data || []).filter(o => o.status === 'completed' || o.status === 'delivered').length
      const totalSpent = (data || [])
        .filter(o => o.status !== 'cancelled') // Wyklucz anulowane zamówienia
        .reduce((s,o)=>s + (o.total || 0), 0)
      setStats({ totalOrders, completedOrders, totalSpent })
    } finally { setLoading(false) }
  }
  if (loading){
    return (
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse"><div className="h-12 bg-white/10 rounded" /></div>)}
      </div>
    )
  }
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Wszystkich zamówień" value={String(stats.totalOrders)} icon="📦" gradient="from-brand-500/25 to-brand-500/10" borderColor="border-brand-500/30" />
      <StatCard title="Ukończonych" value={String(stats.completedOrders)} icon="✓" gradient="from-emerald-500/25 to-emerald-500/10" borderColor="border-emerald-500/30" />
      <StatCard title="Łączna kwota" value={`${stats.totalSpent.toFixed(2)} zł`} icon="💰" gradient="from-purple-500/25 to-purple-500/10" borderColor="border-purple-500/30" />
    </div>
  )
}

function StatCard({ title, value, icon, gradient, borderColor }){
  return (
    <div className={`rounded-xl border ${borderColor} bg-gradient-to-br ${gradient} backdrop-blur-xs p-6 transition-all hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}

function TabButton({ current, setTab, id, icon, children }){
  const active = current === id
  return (
    <button onClick={()=>setTab(id)} className={[
      'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all whitespace-nowrap',
      active ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg' : 'bg-glass border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
    ].join(' ')}>
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  )
}

function ProfileTab({ profile, setProfile, editing, setEditing, saving, saveProfile, user }){
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Profil użytkownika</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={()=>setEditing(false)} className="rounded-xl border border-white/20 bg-glass px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10" disabled={saving}>Anuluj</button>
              <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50">{saving ? 'Zapisywanie...' : 'Zapisz'}</button>
            </>
          ) : (
            <button onClick={()=>setEditing(true)} className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg">Edytuj profil</button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Podstawowe informacje</h3>
          <Field label="Imię" value={profile.firstName} editing={editing} onChange={(v)=>setProfile(p=>({...p, firstName: v}))} />
          <Field label="Nazwisko" value={profile.lastName} editing={editing} onChange={(v)=>setProfile(p=>({...p, lastName: v}))} />
          <Field label="Email" value={user?.email || ''} editing={false} readOnly />
          <Field label="Telefon" value={profile.phone} editing={editing} onChange={(v)=>setProfile(p=>({...p, phone: v}))} placeholder="+48 123 456 789" />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Adres dostawy</h3>
          <Field label="Adres" value={profile.address} editing={editing} onChange={(v)=>setProfile(p=>({...p, address: v}))} placeholder="ul. Przykładowa 123/45" />
          <Field label="Miasto" value={profile.city} editing={editing} onChange={(v)=>setProfile(p=>({...p, city: v}))} placeholder="Warszawa" />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2 text-green-400"><span className="text-lg">✓</span></div>
              <div>
                <p className="text-sm font-medium text-white">Status konta</p>
                <p className="text-xs text-slate-400">Konto zweryfikowane i aktywne</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, editing, onChange, placeholder, readOnly }){
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {editing && !readOnly ? (
        <input type="text" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-glass px-4 py-3 text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100">{value || <span className="text-slate-500">Nie podano</span>}</div>
      )}
    </div>
  )
}

function OrdersTab({ userId, refreshTrigger }){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { push } = useToast()
  
  console.log('OrdersTab userId:', userId)
  
  useEffect(() => { if (userId) load() }, [userId, refreshTrigger])
  async function load(){
      setLoading(true)
    try{
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      console.log('Orders loaded:', data)
      setOrders(data || [])
    } catch(e){ 
      console.error('Error loading orders:', e)
      setOrders([]) 
    } finally { setLoading(false) }
  }
  async function cancelOrder(id){
    console.log('Attempting to cancel order:', id)
    try{
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Order cancelled successfully')
      push('Zamówienie zostało anulowane', 'success')
      await load() // Dodaj await żeby poczekać na odświeżenie
    } catch(e){ 
      console.error('Cancel order error:', e)
      push('Błąd podczas anulowania zamówienia', 'error')
    }
  }

  async function confirmDelivery(id){
    console.log('Attempting to confirm delivery:', id)
    try{
      const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Delivery confirmed successfully')
      push('Odbiór zamówienia potwierdzony!', 'success')
      await load() // Dodaj await żeby poczekać na odświeżenie
    } catch(e){ 
      console.error('Confirm delivery error:', e)
      push('Błąd podczas potwierdzania odbioru', 'error')
    }
  }
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Historia zamówień</h2>
      {loading ? (
        <div className="text-center text-slate-400 py-8">Ładowanie zamówień...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-slate-400 py-12"><div className="text-4xl mb-4">📦</div><p>Nie masz jeszcze żadnych zamówień</p><p className="text-sm">Zamów swoje pierwsze jedzenie!</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div 
              key={order.id} 
              className="rounded-xl border border-white/10 bg-white/5 p-6 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {order.order_name || `Zamówienie #${order.id.slice(-8)}`}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusToClass(order.status)}`}>
                  {statusToText(order.status)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-300">
                  Pozycje: {(() => {
                    try {
                      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                      return items?.map(item => `${item.name} (${item.qty}x)`).join(', ') || 'Brak szczegółów';
                    } catch {
                      return 'Brak szczegółów';
                    }
                  })()}
                </div>
                <div className="text-lg font-bold text-brand-400">
                  {order.total?.toFixed(2)} zł
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ze szczegółami zamówienia */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-white">
                {selectedOrder.order_name || `Zamówienie #${selectedOrder.id.slice(-8)}`}
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Status i data */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusToClass(selectedOrder.status)}`}>
                    {statusToText(selectedOrder.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Data zamówienia</p>
                  <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              {/* Pozycje zamówienia */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Pozycje zamówienia</h4>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const items = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items;
                      return items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-white/5">
                          <div>
                            <p className="text-white">{item.name}</p>
                            <p className="text-sm text-slate-400">Ilość: {item.qty}</p>
                          </div>
                          <p className="text-brand-400 font-semibold">
                            {(item.price * item.qty).toFixed(2)} zł
                          </p>
                        </div>
                      )) || <p className="text-slate-400">Brak szczegółów pozycji</p>;
                    } catch {
                      return <p className="text-slate-400">Brak szczegółów pozycji</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Podsumowanie */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-white">Razem:</span>
                  <span className="text-brand-400">{selectedOrder.total?.toFixed(2)} zł</span>
                </div>
              </div>

              {/* Informacje o restauracji */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Informacje o restauracji</h4>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-400 text-sm">ID restauracji: {selectedOrder.restaurant}</p>
                  <p className="text-slate-400 text-sm">ID klienta: {selectedOrder.customer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusToClass(status){
  switch(status){
    case 'delivered': return 'bg-green-600/20 text-green-500 border-green-600/30'
    case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}
function statusToText(status){
  switch(status){
    case 'delivered': return 'Dostarczone'
    case 'completed': return 'Gotowe do odbioru'
    case 'preparing': return 'W przygotowaniu'
    case 'pending': return 'Oczekiwanie na zatwierdzenie'
    case 'cancelled': return 'Anulowane'
    default: return 'Nieznany'
  }
}

function SettingsTab(){
  const [email, setEmail] = useState(true)
  const [pushN, setPushN] = useState(false)
  const [sms, setSms] = useState(false)
  const { push } = useToast()
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Ustawienia</h2>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Powiadomienia</h3>
        <SettingToggle label="Powiadomienia email" description="Otrzymuj powiadomienia o statusie zamówień na email" checked={email} onChange={setEmail} />
        <SettingToggle label="Powiadomienia push" description="Otrzymuj powiadomienia push w przeglądarce" checked={pushN} onChange={setPushN} />
        <SettingToggle label="Powiadomienia SMS" description="Otrzymuj ważne powiadomienia przez SMS" checked={sms} onChange={setSms} />
        <div className="mt-6"><button onClick={()=>push('Ustawienia zostały zapisane','success')} className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg">Zapisz ustawienia</button></div>
      </div>
    </div>
  )
}

function SettingToggle({ label, description, checked, onChange }){
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button onClick={()=>onChange(!checked)} className={[ 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', checked ? 'bg-brand-500' : 'bg-gray-600' ].join(' ')}>
        <span className={[ 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform', checked ? 'translate-x-6' : 'translate-x-1' ].join(' ')} />
      </button>
    </div>
  )
}

// Order Tab Component
function OrderTab({
  restaurants,
  selectedRestaurant,
  setSelectedRestaurant,
  menuItems,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  getCartTotal,
  placeOrder,
  placingOrder,
  loadingRestaurants,
  loadingMenu
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Zamów jedzenie</h2>
      
      {/* Restaurant Selection */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Wybierz restaurację</label>
        <select 
          className="w-full rounded-xl bg-white/5 text-white border border-white/10 p-3"
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          disabled={loadingRestaurants}
        >
          <option value="">{loadingRestaurants ? 'Ładowanie...' : 'Wybierz restaurację'}</option>
          {restaurants.map(restaurant => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name} {restaurant.city && `- ${restaurant.city}`}
            </option>
          ))}
        </select>
            </div>

      {/* Menu Items */}
      {selectedRestaurant && (
                  <div>
          <h3 className="text-lg font-semibold text-white mb-4">Menu</h3>
          {loadingMenu ? (
            <div className="text-center text-slate-400 py-8">Ładowanie menu...</div>
          ) : menuItems.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Brak pozycji w menu</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {menuItems.map(item => (
                <div key={item.id} className="rounded-xl border border-white/20 bg-gray-950/80 p-4 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <span className="text-brand-400 font-bold">{item.price.toFixed(2)} zł</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full mt-3 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                  >
                    Dodaj do koszyka
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-xl border border-white/20 bg-gray-950/80 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Koszyk</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-900/70 border border-white/20">
                <div className="flex-1">
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-gray-300">{item.price.toFixed(2)} zł</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 border border-white/20"
                  >
                    -
                  </button>
                  <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 border border-white/20"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-white">Suma:</span>
              <span className="text-xl font-bold text-brand-500">{getCartTotal().toFixed(2)} zł</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {placingOrder ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

