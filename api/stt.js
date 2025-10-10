// Proxy endpoint for STT API
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward request to backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://freeflow-backend-i7utvfwp3-lukis-projects-01382554.vercel.app/stt'
      : 'http://localhost:3000/stt';
    
    console.log('🔄 STT Proxy: Forwarding to backend:', backendUrl);
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Handle different content types
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Direct file upload
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: req.body,
        headers: {
          ...req.headers
        }
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // JSON with base64 audio
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('STT Proxy error:', error);
    res.status(500).json({ 
      error: 'STT Proxy error', 
      message: error.message 
    });
  }
}
