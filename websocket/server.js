const express = require('express');
const { WebSocket, WebSocketServer } = require('ws');
require('dotenv').config();

// Railway automatically provides PORT
const PORT = process.env.PORT || 3001;

// Basic health check endpoint
const app = express();
app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', async (ws) => {
  console.log('New WebSocket connection established with frontend');
  
  // Create connection to Python backend
  const backendWs = new WebSocket(process.env.BACKEND_WS_URL);
  console.log('Attempting to connect to Python backend at:', process.env.BACKEND_WS_URL);

  backendWs.onopen = () => {
    console.log('Successfully connected to Python backend');
    // Send initial connection success to frontend
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected'
    }));
  };

  backendWs.onerror = (error) => {
    console.error('Backend WebSocket error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to connect to Python backend'
    }));
  };

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message from frontend:', data);
      const { companyDetails, sectionId } = data;

      const prompt = generatePrompt(companyDetails, sectionId);
      console.log('Generated prompt:', prompt);

      // Send to Python backend
      backendWs.send(JSON.stringify({
        message: prompt,
        sectionId
      }));

      // Handle responses from Python backend
      backendWs.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log('Received response from backend:', response);
        
        if (response.status === 'error') {
          ws.send(JSON.stringify({
            type: 'error',
            message: response.error
          }));
          return;
        }

        // Forward the response to the frontend
        ws.send(JSON.stringify({
          type: response.type || 'token',
          content: response.response,
          sectionId: response.sectionId
        }));
      };

    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  // Clean up WebSocket connection on close
  ws.on('close', () => {
    console.log('Frontend WebSocket connection closed');
    backendWs.close();
  });

  // Ping/Pong to keep connection alive
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(interval);
  });
});

function generatePrompt(companyDetails, sectionId) {
  const { companyName, sector, transactionType } = companyDetails;
  
  const prompts = {
    'executive-summary': `Write an executive summary for ${companyName}, a ${sector} company seeking ${transactionType}. Focus on the key investment highlights and value proposition.`,
    'company-overview': `Provide a detailed company overview for ${companyName} operating in the ${sector} industry. Include business model, history, and key strengths.`,
    'market-opportunity': `Analyze the market opportunity for ${companyName} in the ${sector} sector. Include market size, growth trends, and competitive landscape.`,
    'financial-analysis': `Present a comprehensive financial analysis framework for ${companyName}. Include key metrics and growth drivers.`,
    'investment-highlights': `Detail the key investment highlights and growth opportunities for ${companyName} in the context of this ${transactionType}.`
  };

  return prompts[sectionId] || '';
}