"use client"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { ArrowLeft } from "lucide-react"
import type { Template } from "../../types"

const templates: Template[] = [
  {
    id: "cim",
    name: "Confidential Information Memorandum (CIM)",
    description: "A document providing buyers with detailed company information",
    icon: "📄"
  },
  {
    id: "teaser",
    name: "Deal Teaser",
    description: "A brief document to spark interest in potential buyers or investors",
    icon: "🎯"
  },
  {
    id: "dcf",
    name: "Discounted Cash Flow (DCF)",
    description: "A valuation method for investment value from future cash flows",
    icon: "💹"
  },
  {
    id: "comps",
    name: "Company Comparables Analysis",
    description: "A valuation method comparing company multiples to similar firms",
    icon: "📊"
  }
]

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onBack: () => void;
}

export function TemplateSelector({ onSelect, onBack }: TemplateSelectorProps) {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Advisors
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
        <p className="text-gray-600">Start a deal document or integrate live company financial data</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-lg transition-all duration-200 border border-gray-200"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl mb-4">{template.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 mb-6">{template.description}</p>
                </div>
              </div>
              <div className="flex justify-end">
                {template.id === "cim" ? (
                  <Button 
                    onClick={() => onSelect(template)}
                    className="w-full sm:w-auto"
                  >
                    Use this Template
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    disabled 
                    className="w-full sm:w-auto opacity-50"
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}