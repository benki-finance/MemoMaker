'use client';

import { useState } from 'react';
import { AI_ADVISORS } from '../../lib/constants';
import { Button } from '../ui/button';

interface AIFeedbackPanelProps {
  section: string;
  onClose: () => void;
}

export function AIFeedbackPanel({ section, onClose }: AIFeedbackPanelProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(AI_ADVISORS[0]);
  const [feedback, setFeedback] = useState('');

  const getFeedback = async () => {
    // Simulate AI feedback
    setFeedback(`${selectedAdvisor.name}'s feedback on ${section}:
    This section could be strengthened by adding more quantitative metrics...`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">AI Feedback</h3>
        <Button variant="ghost" onClick={onClose}>×</Button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select Advisor
        </label>
        <select
          className="w-full p-2 border rounded"
          value={selectedAdvisor.id}
          onChange={(e) => setSelectedAdvisor(
            AI_ADVISORS.find(a => a.id === Number(e.target.value)) || AI_ADVISORS[0]
          )}
        >
          {AI_ADVISORS.map(advisor => (
            <option key={advisor.id} value={advisor.id}>
              {advisor.name} - {advisor.role}
            </option>
          ))}
        </select>
      </div>

      <Button 
        className="w-full mb-4"
        onClick={getFeedback}
      >
        Get Feedback
      </Button>

      {feedback && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <p className="whitespace-pre-line">{feedback}</p>
        </div>
      )}
    </div>
  );
}