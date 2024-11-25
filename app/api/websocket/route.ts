import { WebSocketServer } from 'ws';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
  if (res.socket.server.ws) {
    console.log('WebSocket server already exists');
    res.end();
    return;
  }

  console.log('Creating new WebSocket server');
  const wss = new WebSocketServer({ server: res.socket.server });
  res.socket.server.ws = wss;

  wss.on('connection', async (ws) => {
    console.log('New WebSocket connection established with frontend');
    
    // Create connection to Python backend
    const backendWs = new WebSocket(process.env.NEXT_PUBLIC_BACKEND_WS_URL!);
    console.log('Attempting to connect to Python backend at:', process.env.NEXT_PUBLIC_BACKEND_WS_URL);

    backendWs.onopen = () => {
      console.log('Successfully connected to Python backend');
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

      } catch (error: any) {
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
  });

  res.end();
}

type SectionId = 'executive-summary' | 'company-overview' | 'market-opportunity' | 'financial-analysis' | 'investment-highlights';

function generatePrompt(companyDetails: any, sectionId: SectionId): string {
  const { companyName, sector, transactionType } = companyDetails;
  
  const prompts: Record<SectionId, string> = {
    'executive-summary': `Write an executive summary for ${companyName}, a ${sector} company seeking ${transactionType}. Focus on the key investment highlights and value proposition.`,
    'company-overview': `Provide a detailed company overview for ${companyName} operating in the ${sector} industry. Include business model, history, and key strengths.`,
    'market-opportunity': `Analyze the market opportunity for ${companyName} in the ${sector} sector. Include market size, growth trends, and competitive landscape.`,
    'financial-analysis': `Present a comprehensive financial analysis framework for ${companyName}. Include key metrics and growth drivers.`,
    'investment-highlights': `Detail the key investment highlights and growth opportunities for ${companyName} in the context of this ${transactionType}.`
  };

  return prompts[sectionId] || '';
}