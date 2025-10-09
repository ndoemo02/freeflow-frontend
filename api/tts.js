// Proxy endpoint for TTS API
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
    // Forward request to backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://freeflow-backend.vercel.app/api/tts'
      : 'http://localhost:3003/api/tts';
    
    console.log('🔄 TTS Proxy: Forwarding to backend:', backendUrl);
    console.log('🔄 TTS Proxy: Request body:', JSON.stringify(req.body, null, 2));
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    
    console.log('🔄 TTS Proxy: Backend response status:', response.status);
    console.log('🔄 TTS Proxy: Backend response data:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('TTS Proxy error:', error);
    res.status(500).json({ 
      error: 'TTS Proxy error', 
      message: error.message 
    });
  }
}

