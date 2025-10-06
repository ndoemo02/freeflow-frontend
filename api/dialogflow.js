// Local Dialogflow endpoint - fallback when backend is down
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
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required' 
      });
    }

    console.log('🎯 Dialogflow input:', text);

    // Simple fallback responses for testing
    const responses = {
      'pizza': 'Znalazłem pizzerie w okolicy! Którą wybierasz?',
      'jedzenie': 'Pokażę Ci restauracje w okolicy!',
      'taxi': 'Zamawiam taxi! Gdzie chcesz jechać?',
      'hotel': 'Znajdę Ci hotel! W jakim mieście?',
      'test': 'Test działa! Dialogflow endpoint jest aktywny.',
      'chcę zamówić': 'Co chciałbyś zamówić? Pizza, burger, czy coś innego?',
      'zamówić': 'Pokażę Ci dostępne opcje!',
      'restauracje': 'Znalazłem restauracje w okolicy!',
      'menu': 'Oto nasze menu!',
      'zamówienie': 'Pomogę Ci złożyć zamówienie!'
    };

    // Find best match
    let bestResponse = 'Rozumiem! Jak mogę Ci pomóc?';
    const lowerText = text.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
      if (lowerText.includes(key)) {
        bestResponse = response;
        break;
      }
    }

    const result = {
      fulfillmentText: bestResponse,
      intent: 'fallback',
      confidence: 0.8,
      parameters: {},
      allRequiredParamsPresent: true,
      timestamp: new Date().toISOString()
    };

    console.log('🤖 Dialogflow response:', result);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Dialogflow error:', error);
    res.status(500).json({ 
      error: 'Dialogflow error', 
      message: error.message 
    });
  }
}
