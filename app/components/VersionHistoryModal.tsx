"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Clock, GitCommit } from "lucide-react"
import { useState } from "react"

interface VersionHistoryModalProps {
  showVersionDialog: boolean
  setShowVersionDialog: (show: boolean) => void
  activeSection: string
  versionHistory: {
    [key: string]: {
      id: string
      timestamp: number
      content: string
      changes: {
        type: 'addition' | 'deletion' | 'unchanged'
        content: string
        color: string
        advisor?: string
      }[]
      stats: {
        additions: number
        deletions: number
        sectionsAffected: number
        recommendedChanges: number
      }
    }[]
  }
  onRevert?: (content: string) => void
}

export function VersionHistoryModal({
  showVersionDialog,
  setShowVersionDialog,
  activeSection,
  versionHistory = {},
  onRevert
}: VersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<number>(0)
  const sectionHistory = versionHistory[activeSection] || []

  if (!activeSection || !versionHistory || sectionHistory.length === 0) {
    return (
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Version History
            </DialogTitle>
          </DialogHeader>
          <div>No version history available</div>
        </DialogContent>
      </Dialog>
    )
  }

  const currentVersion = sectionHistory[selectedVersion]

  return (
    <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Version History - {activeSection}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Version selector */}

          <div className="border rounded-lg divide-y">
            {sectionHistory.map((version, index) => (
              <div
                key={version.id}
                className={`p-4 cursor-pointer hover:bg-slate-50 ${
                  selectedVersion === index ? 'bg-slate-50' : ''
                }`}
                onClick={() => setSelectedVersion(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      Version #{version.id}
                    </div>
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {new Date(version.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-green-600">+{version.stats.additions}</span>
                      <span className="text-red-600">-{version.stats.deletions}</span>
                      <span>{version.stats.sectionsAffected} sections</span>
                      <span>{version.stats.recommendedChanges} changes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Diff view */}
          <div className="space-y-2">
            <h3 className="font-medium">Changes</h3>
            <div className="p-4 rounded-lg bg-slate-50">
              <pre className="whitespace-pre-wrap text-sm">
                {currentVersion.changes.map((change, index) => (
                  <span
                    key={index}
                    className={`px-1 rounded ${
                      change.type === 'addition'
                        ? 'bg-green-100 text-green-800'
                        : change.type === 'deletion'
                        ? 'bg-red-100 text-red-800 line-through'
                        : ''
                    }`}
                  >
                    {change.content}{' '}
                  </span>
                ))}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm">Export</Button>
            <Button size="sm">Print</Button>
            {onRevert && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onRevert(currentVersion.content)}
              >
                Revert to this version
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}