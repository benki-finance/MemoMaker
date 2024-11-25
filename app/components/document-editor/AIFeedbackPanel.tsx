'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { advisors } from '../ai-advisor/AIAdvisorPanel';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface AIFeedbackPanelProps {
  content: string;
  onClose: () => void;
  sectionId: string;
  onContentUpdate: (newContent: string) => void;
}

export function AIFeedbackPanel({ content, onClose, sectionId, onContentUpdate }: AIFeedbackPanelProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(advisors[0]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const { ws } = useWebSocket();

  const regenerateContent = async () => {
    if (!ws) return;
    
    setIsRegenerating(true);
    setNewContent('');
    
    try {
      ws.send(JSON.stringify({
        type: 'regenerate',
        sectionId,
        content,
        advisor: selectedAdvisor.id
      }));
    } catch (error) {
      console.error('WebSocket error:', error);
      setIsRegenerating(false);
    }
  };

  // Handle WebSocket messages
  ws?.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'token') {
      setNewContent(prev => prev + data.content);
    } else if (data.type === 'done') {
      if (newContent.trim()) {
        onContentUpdate(newContent);
      }
      setIsRegenerating(false);
    } else if (data.type === 'error') {
      console.error('Error:', data.message);
      setIsRegenerating(false);
    }
  });

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white dark:bg-gray-800 shadow-lg border-l">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">AI Review</h3>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Select Financial Advisor</h4>
            <div className="grid gap-3">
              {advisors.map((advisor) => (
                <Card 
                  key={advisor.id}
                  className={`cursor-pointer transition-all ${
                    selectedAdvisor.id === advisor.id 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedAdvisor(advisor)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{advisor.icon}</div>
                      <div>
                        <h3 className="font-semibold">{advisor.name}</h3>
                        <p className="text-sm text-gray-600">{advisor.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <Button 
            className="w-full"
            onClick={regenerateContent}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Regenerating...
              </div>
            ) : (
              'Regenerate Content'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}