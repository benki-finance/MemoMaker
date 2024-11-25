"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Slider } from "../ui/slider"
import { Clock, ChevronDown, ChevronRight, X, Loader2, MessageSquare } from "lucide-react"
import { VersionHistoryModal } from "../VersionHistoryModal"
import { toast } from "sonner"
import { useWebSocket } from "../../contexts/WebSocketContext"
import { SECTORS, TRANSACTION_TYPES } from "../../config/constants"
import { AIFeedbackPanel } from './AIFeedbackPanel'

interface Section {
  id: string
  title: string
  content: string
  versions: Array<{
    id: string
    content: string
    timestamp: Date
    advisor?: string
    changes: Array<{
      type: 'addition' | 'deletion' | 'unchanged'
      content: string
      color: string
      advisor?: string
    }>
    stats: {
      additions: number
      deletions: number
      sectionsAffected: number
      recommendedChanges: number
    }
  }>
  isExpanded: boolean
}

interface CompanyDetails {
  companyName: string
  sector: string
  transactionType: string
}

const initialSections: Section[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    content: "",
    versions: [],
    isExpanded: true
  },
  {
    id: "company-overview",
    title: "Company Overview",
    content: "",
    versions: [],
    isExpanded: false
  },
  {
    id: "market-opportunity",
    title: "Market Opportunity",
    content: "",
    versions: [],
    isExpanded: false
  },
  {
    id: "financial-analysis",
    title: "Financial Analysis",
    content: "",
    versions: [],
    isExpanded: false
  },
  {
    id: "investment-highlights",
    title: "Investment Highlights",
    content: "",
    versions: [],
    isExpanded: false
  }
]

export function Editor() {
  // State management
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingSections, setStreamingSections] = useState<Set<string>>(new Set())
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({})
  const { ws, isConnected } = useWebSocket()
  
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    companyName: "",
    sector: SECTORS[0],
    transactionType: TRANSACTION_TYPES[0]
  })

  const [settings, setSettings] = useState({
    technicalDepth: 50,
    creativity: 50,
    length: 50,
    financialJargon: 50,
    riskFraming: 50
  })

  const [feedbackSection, setFeedbackSection] = useState<Section | null>(null);

  useEffect(() => {
    console.log('WebSocket status:', { isConnected, ws });
  }, [isConnected, ws]); 

  // WebSocket message handler
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'token') {
        setSections(sections => sections.map(section => 
          section.id === data.sectionId
            ? { ...section, content: section.content + data.content }
            : section
        ));

        setGenerationProgress(prev => ({
          ...prev,
          [data.sectionId]: (prev[data.sectionId] || 0) + 1
        }));
      } 
      else if (data.type === 'done') {
        setSections(sections => sections.map(section => 
          section.id === data.sectionId
            ? {
                ...section,
                versions: [
                  {
                    id: Date.now().toString(),
                    content: section.content,
                    timestamp: new Date(),
                    changes: [],
                    stats: {
                      additions: 1,
                      deletions: 0,
                      sectionsAffected: 1,
                      recommendedChanges: 0
                    }
                  },
                  ...section.versions
                ]
              }
            : section
        ));

        setStreamingSections(current => {
          const updated = new Set(current);
          updated.delete(data.sectionId);
          return updated;
        });
        
        setGenerationProgress(prev => {
          const updated = { ...prev };
          delete updated[data.sectionId];
          return updated;
        });

        if (streamingSections.size === 1) {
          setIsGenerating(false);
          toast.success("CIM generation completed!");
        }

        toast.success(`Generated ${sections.find(s => s.id === data.sectionId)?.title}`);
      } 
      else if (data.type === 'error') {
        toast.error(data.message);
        setStreamingSections(new Set());
        setGenerationProgress({});
        setIsGenerating(false);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, streamingSections.size]);

  // Add right after the WebSocket context import (around line 10-11)
const generateAllSections = async () => {
  console.log('Generate button clicked', {
    wsStatus: !!ws,
    isConnected,
    companyDetails
  });

  if (!ws || !isConnected) {
    toast.error("WebSocket connection not available");
    return;
  }

  if (!companyDetails.companyName || !companyDetails.sector || !companyDetails.transactionType) {
    toast.error("Please fill in all company details first");
    return;
  }

  setIsGenerating(true);
  
  // Clear existing content and expand all sections
  setSections(sections.map(section => ({
    ...section,
    content: '',
    isExpanded: true
  })));

  // Start streaming for each section
  sections.forEach(section => {
    setStreamingSections(current => new Set([...current, section.id]));
    const message = {
      type: 'generate', // Add this line
      companyDetails,
      sectionId: section.id
    };
    console.log('Sending message:', message);
    ws.send(JSON.stringify(message));
  });

  toast.success("Starting CIM generation...");
};

  const updateSectionContent = (sectionId: string, newContent: string, advisor?: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            content: newContent,
            versions: [
              {
                id: Date.now().toString(),
                content: newContent,
                timestamp: new Date(),
                advisor: advisor,
                changes: calculateChanges(section.content, newContent),
                stats: {
                  additions: countAdditions(section.content, newContent),
                  deletions: countDeletions(section.content, newContent),
                  sectionsAffected: 1,
                  recommendedChanges: 0
                }
              },
              ...section.versions
            ]
          }
        : section
    ));
  };

  const calculateChanges = (oldContent: string, newContent: string) => {
    const changes: Array<{
      type: 'addition' | 'deletion' | 'unchanged'
      content: string
      color: string
      advisor?: string
    }> = [];
    const oldWords = oldContent.split(' ');
    const newWords = newContent.split(' ');
    
    let i = 0, j = 0;
    while (i < oldWords.length || j < newWords.length) {
      if (i >= oldWords.length) {
        changes.push({
          type: 'addition',
          content: newWords[j],
          color: 'green'
        });
        j++;
      } else if (j >= newWords.length) {
        changes.push({
          type: 'deletion',
          content: oldWords[i],
          color: 'red'
        });
        i++;
      } else if (oldWords[i] !== newWords[j]) {
        changes.push({
          type: 'deletion',
          content: oldWords[i],
          color: 'red'
        });
        changes.push({
          type: 'addition',
          content: newWords[j],
          color: 'green'
        });
        i++;
        j++;
      } else {
        changes.push({
          type: 'unchanged',
          content: oldWords[i],
          color: 'gray'
        });
        i++;
        j++;
      }
    }
    return changes;
  };

  const countAdditions = (oldContent: string, newContent: string) => {
    const oldWords = oldContent.trim().split(/\s+/);
    const newWords = newContent.trim().split(/\s+/);
    
    return newWords.filter(word => !oldWords.includes(word)).length;
  };

  const countDeletions = (oldContent: string, newContent: string) => {
    const oldWords = oldContent.trim().split(/\s+/);
    const newWords = newContent.trim().split(/\s+/);
    
    return oldWords.filter(word => !newWords.includes(word)).length;
  };

    // Continue from previous part...

    return (
      <div className="flex h-screen">
        <div className="flex-1 overflow-auto">
          {/* Header and Company Details Form */}
          <div className="border-b p-4 bg-white sticky top-0 z-10 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Confidential Information Memorandum</h1>
              <Button 
                variant="outline"
                onClick={() => setShowFeedback(false)}
              >
                Save Draft
              </Button>
            </div>
            
            {/* Company Details Form */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyDetails.companyName}
                  onChange={(e) => setCompanyDetails(prev => ({
                    ...prev,
                    companyName: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter company name..."
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry / Sector
                </label>
                <select
                  value={companyDetails.sector}
                  onChange={(e) => setCompanyDetails(prev => ({
                    ...prev,
                    sector: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={companyDetails.transactionType}
                  onChange={(e) => setCompanyDetails(prev => ({
                    ...prev,
                    transactionType: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
  
            {/* Generate Button */}
            <div className="flex justify-center">
            <Button
              className={`w-1/3 ${
                isGenerating 
                  ? 'bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-semibold py-3 rounded-lg transition-colors`}
              onClick={() => {
                console.log('Button clicked', {
                  isGenerating,
                  isConnected,
                  companyName: companyDetails.companyName
                });
                generateAllSections();
              }}
              disabled={isGenerating || !isConnected || !companyDetails.companyName.trim()}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating CIM...
                </div>
              ) : (
                'Generate CIM'
              )}
            </Button>
            </div>
          </div>
  
          {/* Sections */}
          <div className="p-6 space-y-4">
            <AnimatePresence>
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg shadow-sm"
                >
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSections(sections.map(s => 
                        s.id === section.id ? {...s, isExpanded: !s.isExpanded} : s
                      ))
                    }}
                  >
                    <div className="flex items-center">
                      {section.isExpanded ? 
                        <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      }
                      <h2 className="text-lg font-medium ml-2">
                        {section.title}
                        {streamingSections.has(section.id) && (
                          <span className="ml-2 text-sm text-green-600 flex items-center">
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </span>
                        )}
                      </h2>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {section.content && !streamingSections.has(section.id) && (
                        <>
                          <Button
                            className="border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSectionContent(section.id, section.content);
                              toast.success("Version saved successfully");
                            }}
                          >
                        
                            Save Version
                          </Button>
                          <Button
                            className="border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackSection(section);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Get Feedback
                          </Button>
                        </>
                      )}
                      {section.versions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSection(section.id)
                            setShowVersionDialog(true)
                          }}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {section.isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 border-t">
                          <textarea
                            className="w-full min-h-[200px] p-3 rounded-md border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            value={section.content}
                            onChange={(e) => {
                              setSections(sections.map(s =>
                                s.id === section.id ? {...s, content: e.target.value} : s
                              ))
                            }}
                            placeholder={`Enter ${section.title.toLowerCase()}...`}
                            disabled={streamingSections.has(section.id)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
  
        {/* Version History Modal */}
        {selectedSection && (
          <VersionHistoryModal
            showVersionDialog={showVersionDialog}
            setShowVersionDialog={setShowVersionDialog}
            activeSection={selectedSection}
            versionHistory={sections.reduce((acc, section) => ({
              ...acc,
              [section.id]: section.versions
            }), {})}
            onRevert={(content) => {
              setSections(sections.map(section =>
                section.id === selectedSection
                  ? { ...section, content }
                  : section
              ))
              setShowVersionDialog(false)
            }}
          />
        )}
        
        {feedbackSection && (
          <div className="w-96 border-l h-screen overflow-auto">
            <AIFeedbackPanel
              content={feedbackSection.content}
              sectionId={feedbackSection.id}
              onClose={() => setFeedbackSection(null)}
              onContentUpdate={(newContent) => {
                updateSectionContent(feedbackSection.id, newContent, selectedAdvisor || undefined);
              }}
            />
          </div>
        )}
      </div>
    )
  }