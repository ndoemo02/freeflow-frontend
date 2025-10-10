import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../state/auth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import PanelHeader from '../../components/PanelHeader'
import RideTab from '../../components/RideTab'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { manageTurn } from '../../lib/DialogManager'
import { speakTts } from '../../lib/ttsClient'
import VoiceDock from '../../components/VoiceDock'

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

  // Ride booking states
  const [rideForm, setRideForm] = useState({
    pickupAddress: '',
    destinationAddress: '',
    estimatedPrice: 0,
    notes: '',
    taxiCorporation: ''
  })
  const [bookingRide, setBookingRide] = useState(false)
  const [taxiCorporations, setTaxiCorporations] = useState([])
  const [loadingCorporations, setLoadingCorporations] = useState(false)

  // Order system states
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastOrder, setLastOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Voice ordering states
  const [voiceQuery, setVoiceQuery] = useState('')
  const [dialogSlots, setDialogSlots] = useState({})
  const [voiceMessages, setVoiceMessages] = useState([])
  const [speaking, setSpeaking] = useState(false)

  // STT Hook
  const {
    recording,
    interimText,
    finalText,
    startRecording,
    stopRecording,
  } = useSpeechRecognition({
    onTranscriptChange: (transcript) => setVoiceQuery(transcript),
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!user?.id) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
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

  // Load taxi corporations on mount
  useEffect(() => {
    loadTaxiCorporations()
  }, [])

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
      const { error } = await supabase.from('profiles').upsert({
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

  // Load taxi corporations
  const loadTaxiCorporations = async () => {
    setLoadingCorporations(true)
    try {
      // Mock data - w rzeczywistości z Supabase
      const mockCorporations = [
        { id: '1', name: 'Taxi Express', rating: 4.8, price: '15-20 zł/km', available: true },
        { id: '2', name: 'City Taxi', rating: 4.6, price: '12-18 zł/km', available: true },
        { id: '3', name: 'Premium Taxi', rating: 4.9, price: '20-25 zł/km', available: true },
        { id: '4', name: 'Eco Taxi', rating: 4.7, price: '14-19 zł/km', available: false },
        { id: '5', name: 'Night Taxi', rating: 4.5, price: '18-22 zł/km', available: true }
      ]
      setTaxiCorporations(mockCorporations)
    } catch (error) {
      console.error('Error loading taxi corporations:', error)
    } finally {
      setLoadingCorporations(false)
    }
  }

  // Ride booking functions
  const calculatePrice = () => {
    // Simple price calculation based on distance (mock)
    const basePrice = 15
    const distance = Math.random() * 20 + 5 // Mock distance 5-25 km
    const price = basePrice + (distance * 2.5)
    setRideForm(prev => ({ ...prev, estimatedPrice: Math.round(price) }))
  }

  const bookRide = async () => {
    if (!rideForm.pickupAddress || !rideForm.destinationAddress || !rideForm.taxiCorporation) {
      push('Wypełnij wszystkie wymagane pola', 'error')
      return
    }

    setBookingRide(true)
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          pickup_address: rideForm.pickupAddress,
          destination_address: rideForm.destinationAddress,
          estimated_price: rideForm.estimatedPrice,
          notes: rideForm.notes,
          taxi_corporation: rideForm.taxiCorporation,
          status: 'pending',
          order_type: 'ride'
        })

      if (error) throw error

      push('Przejazd zamówiony! Kierowca zostanie powiadomiony', 'success')
      setRideForm({
        pickupAddress: '',
        destinationAddress: '',
        estimatedPrice: 0,
        notes: '',
        taxiCorporation: ''
      })
    } catch (error) {
      console.error('Error booking ride:', error)
      push('Błąd podczas zamawiania przejazdu', 'error')
    } finally {
      setBookingRide(false)
    }
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
    if (!user || !user.id) {
      push('Musisz być zalogowany aby złożyć zamówienie', 'error')
      return
    }

    try {
      setPlacingOrder(true)
      const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant)
      
      console.log('🛒 Placing order:', {
        user_id: user.id,
        restaurant_id: selectedRestaurant,
        total_price: getCartTotal(),
        cart_items: cart.length
      })
      
      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        restaurant_id: selectedRestaurant,
        status: 'pending',
        total_price: getCartTotal()
      })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
              
              // Zapisz szczegóły ostatniego zamówienia
              setLastOrder({
                restaurant: selectedRestaurantData,
                items: [...cart],
                total: getCartTotal(),
                timestamp: new Date().toISOString()
              })
              
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

  const cancelOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id) // Tylko własne zamówienia

      if (error) throw error
      
      push('Zamówienie zostało anulowane', 'success')
      setRefreshTrigger(prev => prev + 1)
      setSelectedOrder(null) // Zamknij modal
    } catch (e) {
      push('Błąd podczas anulowania zamówienia', 'error')
      console.error('Cancel order error:', e)
    }
  }

  // Voice ordering functions
  const handleSTT = async (audioBlob) => {
    try {
      console.log('🎤 STT: Sending audio to backend...')
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      
      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`STT API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.ok && data.text) {
        console.log('🎤 STT: Transcription received:', data.text)
        setVoiceQuery(data.text)
      } else {
        console.error('🎤 STT: No transcription received:', data)
        push('Nie udało się rozpoznać mowy', 'error')
      }
    } catch (error) {
      console.error('🎤 STT Error:', error)
      push('Błąd rozpoznawania mowy', 'error')
    }
  }

  const handleVoiceOrder = async (query = voiceQuery) => {
    if (!query.trim()) return

    try {
      setSpeaking(true)
      
      // Add user message to chat
      const userMessage = { id: Date.now(), role: 'user', text: query }
      setVoiceMessages(prev => [...prev, userMessage])

      // Build context from current state
      const context = {
        selectedRestaurant: selectedRestaurant,
        cartItems: cart.length,
        userLocation: 'Katowice', // You can get this from user profile
        currentTab: tab,
        dialogSlots: dialogSlots
      }

      console.log('🤖 Agent request:', { query, context })
      
      // Call agent endpoint
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: voiceQuery,
          sessionId: `session_${user?.id || 'anonymous'}_${Date.now()}`,
          userId: user?.id || 'anonymous',
          context: JSON.stringify(context)
        })
      })

      if (!response.ok) {
        throw new Error(`Agent request failed: ${response.status}`)
      }

      const agentData = await response.json()
      console.log('🤖 Agent response:', agentData)
      
      if (!agentData.ok) {
        throw new Error(agentData.message || 'Agent returned error')
      }
      
      // Add assistant response to chat
      const assistantMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: agentData.agentResponse.text 
      }
      setVoiceMessages(prev => [...prev, assistantMessage])

      // Handle actions based on agent response
      if (agentData.agentResponse.action === 'food_order') {
        // Could trigger food ordering flow
        console.log('🍕 Food order action detected')
      } else if (agentData.agentResponse.action === 'taxi_booking') {
        // Could switch to taxi tab
        console.log('🚖 Taxi booking action detected')
        setTab('ride')
      } else if (agentData.agentResponse.action === 'hotel_booking') {
        // Could trigger hotel booking
        console.log('🏨 Hotel booking action detected')
      }

      // Play TTS audio if available
      if (agentData.audioContent) {
        await playTtsAudio(agentData.audioContent)
      } else {
        // Fallback to browser TTS
        await speakTts(agentData.agentResponse.text)
      }
      
      // Clear query
      setVoiceQuery('')
    } catch (error) {
      console.error('Voice order error:', error)
      push('Błąd podczas przetwarzania zamówienia głosowego', 'error')
    } finally {
      setSpeaking(false)
    }
  }

  // Play TTS audio from base64
  const playTtsAudio = async (audioContent) => {
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' })
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = reject
        audio.play()
      })
    } catch (error) {
      console.error('TTS audio playback error:', error)
      // Fallback to browser TTS
      await speakTts(agentData.agentResponse.text)
    }
  }

  const addToCartFromVoice = async (slots) => {
    try {
      const { menuItem, menuItemId, quantity = 1, price, restaurantId } = slots
      
      if (!menuItemId || !restaurantId) {
        push('Brak informacji o pozycji menu', 'error')
        return
      }

      // Find restaurant name
      const restaurant = restaurants.find(r => r.id === restaurantId)
      if (!restaurant) {
        push('Nie znaleziono restauracji', 'error')
        return
      }

      // Add to cart
      const cartItem = {
        id: menuItemId,
        name: menuItem,
        price: price,
        quantity: quantity,
        restaurant_id: restaurantId,
        restaurant_name: restaurant.name
      }

      setCart(prev => {
        const existing = prev.find(item => item.id === menuItemId)
        if (existing) {
          return prev.map(item => 
            item.id === menuItemId 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
        return [...prev, cartItem]
      })

      setSelectedRestaurant(restaurantId)
      push(`Dodano ${quantity}x ${menuItem} do koszyka`, 'success')
    } catch (error) {
      console.error('Add to cart error:', error)
      push('Błąd podczas dodawania do koszyka', 'error')
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
        {/* Animated Neon Columns */}
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
                {/* Column Glow */}
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
                {/* Column Border */}
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
        
        {/* Floating Neon Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>
      <div className="mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          {/* Animated Title */}
          <motion.h1
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.span
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: "200% 200%",
                backgroundImage: "linear-gradient(45deg, #00FFFF, #8B5CF6, #EC4899, #00FFFF)"
              }}
              className="bg-clip-text text-transparent"
            >
              Panel Klienta
            </motion.span>
          </motion.h1>
          
          {/* Animated Subtitle */}
          <motion.p
            className="text-lg text-gray-300 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.span
              animate={{
                opacity: [0.7, 1, 0.7],
                textShadow: [
                  "0 0 5px rgba(0, 255, 255, 0.3)",
                  "0 0 20px rgba(0, 255, 255, 0.8)",
                  "0 0 5px rgba(0, 255, 255, 0.3)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Zarządzaj swoim kontem, zamówieniami i ustawieniami
            </motion.span>
          </motion.p>
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CustomerStats userId={user?.id} refreshTrigger={refreshTrigger} />
        </motion.div>

        <motion.div 
          className="mb-6 flex gap-2 overflow-x-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TabButton current={tab} setTab={setTab} id="profile" icon="🙋">Profil</TabButton>
          <TabButton current={tab} setTab={setTab} id="order" icon="🍕">Zamów jedzenie</TabButton>
          <TabButton current={tab} setTab={setTab} id="ride" icon="🚗">Przejazd</TabButton>
          <TabButton current={tab} setTab={setTab} id="orders" icon="📋">Zamówienia</TabButton>
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
                  setProfile={setProfile}
                  editing={editing}
                  setEditing={setEditing}
                  saving={saving}
                  saveProfile={saveProfile}
                  user={user}
                />
              </motion.div>
            )}
            {tab === 'order' && (
              <motion.div
                key="order"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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
                  lastOrder={lastOrder}
                  setLastOrder={setLastOrder}
                />
              </motion.div>
            )}

            {tab === 'ride' && (
              <motion.div
                key="ride"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RideTab
                  rideForm={rideForm}
                  setRideForm={setRideForm}
                  bookingRide={bookingRide}
                  bookRide={bookRide}
                  calculatePrice={calculatePrice}
                  taxiCorporations={taxiCorporations}
                  loadingCorporations={loadingCorporations}
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
                <OrdersTab userId={user?.id} refreshTrigger={refreshTrigger} cancelOrder={cancelOrder} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
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

        {/* Voice interface for ordering */}
        {tab === 'order' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <VoiceDock
              messages={voiceMessages}
              value={voiceQuery}
              onChange={setVoiceQuery}
              onSubmit={handleVoiceOrder}
              recording={recording}
              onMicClick={recording ? stopRecording : startRecording}
              onSTT={handleSTT}
              onClearTranscript={() => {
                setVoiceQuery("");
                setVoiceMessages([]);
                setDialogSlots({});
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
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
        .select('status,total_price')
        .eq('user_id', userId)
      if (error) throw error
      const totalOrders = (data || []).filter(o => o.status !== 'cancelled').length
      const completedOrders = (data || []).filter(o => o.status === 'completed' || o.status === 'delivered').length
      const totalSpent = (data || [])
        .filter(o => o.status !== 'cancelled') // Wyklucz anulowane zamówienia
        .reduce((s,o)=>s + (o.total_price || 0), 0)
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
      transition={{ type: "spring", stiffness: 200 }}
      style={{
        background: `linear-gradient(135deg, ${gradient.includes('brand') ? 'rgba(139, 92, 246, 0.1)' : gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)'}, rgba(0, 0, 0, 0.3))`,
        borderColor: borderColor.includes('brand') ? 'rgba(139, 92, 246, 0.3)' : borderColor.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p 
            className="text-sm font-medium text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              animate={{
                opacity: [0.7, 1, 0.7],
                textShadow: [
                  "0 0 5px rgba(0, 255, 255, 0.2)",
                  "0 0 15px rgba(0, 255, 255, 0.5)",
                  "0 0 5px rgba(0, 255, 255, 0.2)"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {title}
            </motion.span>
          </motion.p>
          <motion.p 
            className="text-2xl font-bold text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 10px rgba(0, 255, 255, 0.3)",
                  "0 0 25px rgba(0, 255, 255, 0.8)",
                  "0 0 10px rgba(0, 255, 255, 0.3)"
                ],
                color: [
                  "#ffffff",
                  "#00FFFF",
                  "#ffffff"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {value}
            </motion.span>
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
            repeatType: "reverse"
          }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  )
}

function TabButton({ current, setTab, id, icon, children }){
  const active = current === id
  return (
    <motion.button 
      onClick={()=>setTab(id)} 
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
      animate={{
        boxShadow: active ? "0 0 20px rgba(0, 255, 255, 0.3)" : "0 0 0px rgba(0, 255, 255, 0)"
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        animate={{ 
          rotate: active ? [0, 10, -10, 0] : 0,
          scale: active ? [1, 1.2, 1] : 1
        }}
        transition={{ 
          duration: 0.5,
          repeat: active ? Infinity : 0,
          repeatType: "reverse"
        }}
      >
        {icon}
      </motion.span>
      <motion.span
        animate={{
          textShadow: active ? [
            "0 0 5px rgba(0, 255, 255, 0.3)",
            "0 0 15px rgba(0, 255, 255, 0.8)",
            "0 0 5px rgba(0, 255, 255, 0.3)"
          ] : "0 0 0px rgba(0, 255, 255, 0)"
        }}
        transition={{
          duration: 2,
          repeat: active ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.span>
    </motion.button>
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

function OrdersTab({ userId, refreshTrigger, cancelOrder, selectedOrder, setSelectedOrder }){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const { push } = useToast()
  
  console.log('OrdersTab userId:', userId)
  
  useEffect(() => { if (userId) load() }, [userId, refreshTrigger])
  async function load(){
      setLoading(true)
    try{
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      console.log('Orders loaded:', data)
      setOrders(data || [])
    } catch(e){ 
      console.error('Error loading orders:', e)
      setOrders([]) 
    } finally { setLoading(false) }
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
                  Pozycje: Zamówienie złożone (szczegóły w koszyku)
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-brand-400">
                    {order.total_price?.toFixed(2)} zł
                  </div>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
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
                  <p className="text-slate-400">Szczegóły pozycji nie są dostępne w tej wersji systemu.</p>
                  <p className="text-slate-400">Zamówienie zostało złożone pomyślnie za kwotę {selectedOrder.total_price?.toFixed(2)} zł.</p>
                </div>
              </div>

              {/* Podsumowanie */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-white">Razem:</span>
                  <span className="text-brand-400">{selectedOrder.total_price?.toFixed(2)} zł</span>
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

              {/* Akcje */}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
                        cancelOrder(selectedOrder.id)
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
                  >
                    Anuluj zamówienie
                  </button>
                </div>
              )}
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
  loadingMenu,
  lastOrder,
  setLastOrder
}) {
  // STT states for OrderTab
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState(null)

  // Initialize STT
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SpeechRecognition()
      rec.lang = 'pl-PL'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onresult = async (event) => {
        let finalText = ''
        let interimText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalText += result[0].transcript
          } else {
            interimText += result[0].transcript
          }
        }

        setTranscript(finalText + (interimText ? ' ' + interimText : ''))

        // Process final text
        if (finalText.trim()) {
          await processVoiceCommand(finalText.trim())
        }
      }

      rec.onerror = (e) => {
        console.error('STT Error:', e.error)
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      setRecognition(rec)
    }
  }, [])

  // Process voice command
  const processVoiceCommand = async (message) => {
    try {
      console.log('🎤 Processing voice command:', message)
      
      // Send to existing order system
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_command: message,
          restaurant_id: selectedRestaurant,
          user_email: 'voice@test.com' // You can get this from auth context
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Voice command processed:', data)
        setTranscript('') // Clear transcript
      } else {
        console.error('❌ Voice command failed:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Voice command error:', error)
    }
  }

  // Toggle recording
  const toggleRecording = () => {
    if (!recognition) return

    if (isRecording) {
      recognition.stop()
    } else {
      recognition.start()
      setIsRecording(true)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Zamów jedzenie</h2>
      
      {/* Restaurant Selection */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Wybierz restaurację</label>
        <div className="flex gap-2">
          <select 
            className="flex-1 rounded-xl bg-gray-800 text-white border border-white/10 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            disabled={loadingRestaurants}
          >
            <option value="" className="bg-gray-800 text-white">{loadingRestaurants ? 'Ładowanie...' : 'Wybierz restaurację'}</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id} className="bg-gray-800 text-white">
                {restaurant.name} {restaurant.city && `- ${restaurant.city}`}
              </option>
            ))}
          </select>
          
          {/* Voice Order Button */}
          <motion.button
            onClick={toggleRecording}
            disabled={!recognition}
            className={`
              px-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-xl
              ${isRecording 
                ? 'bg-red-600/20 border-red-500/50 text-white' 
                : 'bg-black/40 border-cyan-500/30 text-white hover:bg-cyan-500/10'
              }
              ${!recognition ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={isRecording ? 'Zatrzymaj nagrywanie' : 'Zamów głosem'}
            whileHover={{ 
              scale: 1.05,
              boxShadow: isRecording 
                ? "0 0 25px rgba(239, 68, 68, 0.6)" 
                : "0 0 20px rgba(0, 255, 255, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: isRecording ? [1, 1.1, 1] : 1,
              boxShadow: isRecording 
                ? "0 0 20px rgba(239, 68, 68, 0.5)" 
                : "0 0 0px rgba(0, 255, 255, 0)"
            }}
            transition={{ 
              scale: { duration: 0.5, repeat: isRecording ? Infinity : 0 },
              boxShadow: { duration: 0.3 }
            }}
          >
            <motion.span
              animate={{
                rotate: isRecording ? [0, 10, -10, 0] : 0
              }}
              transition={{
                duration: 0.5,
                repeat: isRecording ? Infinity : 0,
                repeatType: "reverse"
              }}
            >
              {isRecording ? '🛑' : '🎤'}
            </motion.span>
          </motion.button>
        </div>
        
        {/* Transcript Display */}
        <AnimatePresence>
          {transcript && (
            <motion.div 
              className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-white/10"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm text-gray-400 mb-1">Rozpoznany tekst:</div>
              <motion.div 
                className="text-green-400 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {transcript}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <motion.div 
              className="grid gap-4 md:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {menuItems.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 backdrop-blur-xl shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -5,
                    boxShadow: "0 20px 40px rgba(0, 255, 255, 0.2)",
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 255, 255, 0.05))',
                    borderColor: 'rgba(0, 255, 255, 0.2)'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <span className="text-brand-400 font-bold">{item.price.toFixed(2)} zł</span>
                  </div>
                  <motion.button
                    onClick={() => addToCart(item)}
                    className="w-full mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 backdrop-blur-xl transition-colors"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 20px rgba(0, 255, 255, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Dodaj do koszyka
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Cart */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            className="rounded-xl border border-white/20 bg-gray-950/80 p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Koszyk</h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="flex justify-between items-center p-3 rounded-lg bg-gray-900/70 border border-white/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-sm text-gray-300">{item.price.toFixed(2)} zł</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 border border-white/20"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      -
                    </motion.button>
                    <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 border border-white/20"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      +
                    </motion.button>
                    <motion.button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 text-red-400 hover:text-red-300"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      🗑️
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-white">Suma:</span>
              <span className="text-xl font-bold text-brand-500">{getCartTotal().toFixed(2)} zł</span>
            </div>
            <motion.button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: placingOrder 
                  ? "0 0 20px rgba(139, 92, 246, 0.5)" 
                  : "0 0 0px rgba(139, 92, 246, 0)"
              }}
              transition={{ duration: 0.3 }}
            >
              {placingOrder ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Składanie zamówienia...
                </motion.span>
              ) : (
                'Złóż zamówienie'
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Podsumowanie ostatniego zamówienia */}
      <AnimatePresence>
        {lastOrder && (
          <motion.div 
            className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.span 
                className="text-green-400 text-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                ✅
              </motion.span>
              <h3 className="text-lg font-semibold text-white">Ostatnie zamówienie</h3>
            </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Restauracja:</span>
              <span className="text-white font-medium">{lastOrder.restaurant?.name}</span>
            </div>
            
            <div>
              <span className="text-gray-300 block mb-2">Pozycje:</span>
              <div className="space-y-1">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-white">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-brand-400">
                      {(item.price * item.quantity).toFixed(2)} zł
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Razem:</span>
                <span className="text-xl font-bold text-green-400">{lastOrder.total.toFixed(2)} zł</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              Złożone: {new Date(lastOrder.timestamp).toLocaleString('pl-PL')}
            </div>
          </div>
          
            <motion.button
              onClick={() => setLastOrder(null)}
              className="mt-4 text-xs text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Zamknij podsumowanie
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

