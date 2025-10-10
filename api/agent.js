// Agent communication endpoint
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
    const { message, sessionId, userId, context } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Missing message parameter' 
      });
    }

    console.log('🤖 Agent Request:', { 
      message: message.substring(0, 100) + '...', 
      sessionId, 
      userId,
      context: context || 'brak'
    });

    // Forward to backend agent endpoint
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://freeflow-backend.vercel.app/api/agent'
      : 'http://localhost:3003/api/agent';
    
    console.log('🔄 Agent Proxy: Forwarding to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || `session_${Date.now()}`,
        userId: userId || 'anonymous',
        context: context || '',
        timestamp: new Date().toISOString()
      })
    });

    const data = await response.json();
    
    console.log('🔄 Agent Proxy: Backend response status:', response.status);
    console.log('🔄 Agent Proxy: Backend response data:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Agent Proxy error:', error);
    res.status(500).json({ 
      error: 'Agent Proxy error', 
      message: error.message 
    });
  }
}
