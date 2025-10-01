// test.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdhlztmjktminrwmzcpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaGx6dG1qa3RtaW5yd216Y3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjgwMTEsImV4cCI6MjA3MjMwNDAxMX0.EmvBqbygr4VLD3PXFaPjbChakRi5YtSrxp8e_K7ZyGY'
const supabase = createClient(supabaseUrl, supabaseKey)

// Test 1: Ładowanie restauracji
const testLoadRestaurants = async () => {
  console.log('🧪 Test: Ładowanie restauracji...')
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')
  
  console.log(`✅ Załadowano ${data?.length || 0} restauracji:`)
  data?.forEach(r => console.log(`  - ${r.name} (${r.city})`))
  return data
}

// Test 2: Ładowanie menu
const testLoadMenu = async (restaurantId) => {
  console.log(`🧪 Test: Ładowanie menu dla restauracji ${restaurantId}...`)
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
  
  console.log(`✅ Załadowano ${data?.length || 0} pozycji menu:`)
  data?.forEach(item => console.log(`  - ${item.name}: ${item.price} zł`))
  return data
}

// Test 3: Ładowanie zamówień
const testLoadOrders = async () => {
  console.log('🧪 Test: Ładowanie zamówień...')
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log(`✅ Załadowano ${data?.length || 0} zamówień:`)
  data?.forEach(order => console.log(`  - Zamówienie ${order.id}: ${order.status} - ${order.total} zł`))
  return data
}

// Test 4: Autoryzacja
const testAuth = async () => {
  console.log('🧪 Test: Autoryzacja...')
  
  // Spróbuj zalogować się jako admin
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@freeflow.com',
    password: 'admin123'
  })
  
  if (error) {
    console.log('❌ Błąd logowania:', error.message)
    return false
  } else {
    console.log('✅ Zalogowano jako:', data.user?.email)
    return true
  }
}

// Test 5: Składanie zamówienia (z autoryzacją)
const testPlaceOrder = async () => {
  console.log('🧪 Test: Składanie zamówienia...')
  
  // Sprawdź czy jesteś zalogowany
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('❌ Nie jesteś zalogowany')
    return
  }
  
  // Znajdź pierwszą restaurację
  const { data: restaurants } = await supabase.from('restaurants').select('id').limit(1)
  if (!restaurants?.[0]) {
    console.log('❌ Brak restauracji')
    return
  }
  
  // Stwórz testowe zamówienie
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer: user.id,
      restaurant: restaurants[0].id,
      status: 'pending',
      total: 25.00,
      items: JSON.stringify([
        { name: 'Test Pizza', price: 25.00, quantity: 1 }
      ])
    })
    .select()
  
  if (error) {
    console.log('❌ Błąd:', error.message)
  } else {
    console.log('✅ Zamówienie złożone:', data[0].id)
  }
}

// Test 6: Zmiana statusu zamówienia
const testUpdateOrderStatus = async () => {
  console.log('   Test: Zmiana statusu zamówienia...')
  
  // Znajdź ostatnie zamówienie
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (!orders?.[0]) {
    console.log('❌ Brak zamówień')
    return
  }
  
  // Zmień status
  const { error } = await supabase
    .from('orders')
    .update({ status: 'preparing' })
    .eq('id', orders[0].id)
  
  if (error) {
    console.log('❌ Błąd:', error.message)
  } else {
    console.log('✅ Status zmieniony na preparing')
  }
}

// Uruchom wszystkie testy
const runAllTests = async () => {
  console.log(' Uruchamianie wszystkich testów...\n')
  
  try {
    // Test 1: Restauracje
    const restaurants = await testLoadRestaurants()
    console.log('')
    
    // Test 2: Menu (pierwsza restauracja)
    if (restaurants?.[0]) {
      await testLoadMenu(restaurants[0].id)
      console.log('')
    }
    
    // Test 3: Zamówienia
    await testLoadOrders()
    console.log('')
    
    // Test 4: Autoryzacja
    const authSuccess = await testAuth()
    console.log('')
    
    if (authSuccess) {
      // Test 5: Składanie zamówienia
      await testPlaceOrder()
      console.log('')
      
      // Test 6: Zmiana statusu
      await testUpdateOrderStatus()
      console.log('')
    }
    
    console.log('✅ Wszystkie testy zakończone!')
  } catch (error) {
    console.error('❌ Błąd podczas testów:', error)
  }
}

runAllTests()