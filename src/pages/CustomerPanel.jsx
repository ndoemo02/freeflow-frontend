import { useEffect, useState } from 'react'
import { supabase } from '../lib/supa'

export default function BusinessPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, payment_status, total, created_at,
          delivery_address,
          customer:profiles ( email ),
          restaurant:restaurants ( name, city )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error) setOrders(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div>Ładowanie…</div>

  return (
    <div>
      <h2>Zamówienia</h2>
      <ul>
        {orders.map(o => (
          <li key={o.id}>
            {o.restaurant?.name} – {o.total} zł – {o.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
