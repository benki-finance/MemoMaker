"use client"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import type { Advisor } from "../../types"

export const advisors: Advisor[] = [
  {
    id: "finance",
    name: "Financial Analyst AI",
    description: "Specialized in financial modeling, DCF analysis, and comparable company analysis.",
    icon: "📊"
  },
  {
    id: "mergers",
    name: "M&A Advisor AI",
    description: "Expert in deal structuring, due diligence, and transaction analysis.",
    icon: "🤝"
  },
  {
    id: "strategy",
    name: "Market Strategist AI",
    description: "Focused on market trends, sector analysis, and investment strategies.",
    icon: "📈"
  },
  {
    id: "ipo",
    name: "IPO Specialist AI",
    description: "Specialized in IPO preparation, pricing, and execution strategy.",
    icon: "🚀"
  }
]

interface AIAdvisorPanelProps {
  onSelect: (advisor: Advisor) => void;
}

export function AIAdvisorPanel({ onSelect }: AIAdvisorPanelProps) {
  return (
    <div className="p-6 bg-slate-50 h-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Advisors Panel</h2>
      <p className="text-gray-600 mb-6">
        Select an advisor to review and provide feedback on your CIM sections
      </p>
      
      <div className="space-y-4">
        {advisors.map((advisor) => (
          <Card 
            key={advisor.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelect(advisor)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{advisor.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{advisor.name}</h3>
                  <p className="text-sm text-gray-600">{advisor.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}