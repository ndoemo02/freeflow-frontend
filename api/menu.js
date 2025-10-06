// Direct Supabase endpoint for Menu API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xdhlztmjktminrwmzcpl.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaGx6dG1qa3RtaW5yd216Y3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjgwMTEsImV4cCI6MjA3MjMwNDAxMX0.EmvBqbygr4VLD3PXFaPjbChakRi5YtSrxp8e_K7ZyGY'
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { restaurant_id, dish } = req.query;
    
    console.log('🍽️ Fetching menu for restaurant:', restaurant_id);
    
    if (!restaurant_id) {
      return res.status(400).json({ 
        error: 'Missing restaurant_id parameter' 
      });
    }

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id);

    // Jeśli podano dish, filtruj po nazwie
    if (dish) {
      query = query.ilike('name', `%${dish}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        message: error.message 
      });
    }

    console.log('✅ Found menu items:', data?.length || 0);
    
    res.status(200).json({ 
      ok: true, 
      menu: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Menu API error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}
