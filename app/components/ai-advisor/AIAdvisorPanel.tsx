"use client"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import type { Advisor } from "../../types"

const advisors: Advisor[] = [
  {
    id: "financial",
    name: "Financial Analyst",
    description: "Expert in financial modeling and valuation",
    icon: "💼"
  },
  {
    id: "strategy",
    name: "Strategy Consultant",
    description: "Specialist in market analysis and business strategy",
    icon: "🎯"
  }
]

interface AIAdvisorPanelProps {
  onSelect: (advisor: Advisor) => void;
}

export function AIAdvisorPanel({ onSelect }: AIAdvisorPanelProps) {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose an AI Advisor</h1>
      <p className="text-gray-600 mb-8">Select an expert to help guide your document creation</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {advisors.map((advisor) => (
          <Card key={advisor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">{advisor.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{advisor.name}</h3>
              <p className="text-gray-600 mb-6">{advisor.description}</p>
              <Button 
                onClick={() => onSelect(advisor)}
                className="w-full"
              >
                Select {advisor.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}