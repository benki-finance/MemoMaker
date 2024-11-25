"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { AIAdvisorPanel } from "./components/ai-advisor/AIAdvisorPanel"
import { TemplateSelector } from "./components/templates/TemplateSelector"
import { Editor } from "./components/document-editor/Editor"
import type { Advisor, Template } from "./types"

export default function Home() {
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [activeTab, setActiveTab] = useState("assistant")

  const handleAdvisorSelect = (advisor: Advisor) => {
    setSelectedAdvisor(advisor)
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setActiveTab("document") // Automatically switch to document tab
  }

  const handleReset = () => {
    setSelectedAdvisor(null)
    setSelectedTemplate(null)
    setActiveTab("assistant")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        <TabsTrigger value="document">Document</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
      </TabsList>
      
      <TabsContent value="assistant">
        {!selectedAdvisor ? (
          <AIAdvisorPanel onSelect={handleAdvisorSelect} />
        ) : (
          <TemplateSelector 
            onSelect={handleTemplateSelect}
            onBack={() => setSelectedAdvisor(null)}
          />
        )}
      </TabsContent>
      
      <TabsContent value="document">
        {selectedTemplate ? (
          <Editor 
            template={selectedTemplate}
            advisor={selectedAdvisor?.name}
            onReset={handleReset}
          />
        ) : (
          <div className="p-4 text-center">
            Please select an advisor and template first
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="feedback">
        <div>Feedback Panel</div>
      </TabsContent>
    </Tabs>
  )
}