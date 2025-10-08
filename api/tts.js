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
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('TTS Proxy error:', error);
    res.status(500).json({ 
      error: 'TTS Proxy error', 
      message: error.message 
    });
  }
}

