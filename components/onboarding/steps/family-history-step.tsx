"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { type Language } from "@/lib/translations"
import { useFamilyMedicalHistory } from "@/hooks/use-medical-conditions"
import { FamilyHistoryDialog } from "@/components/health-records/family-history-dialog"

interface FamilyHistoryStepProps {
  language: Language
}

export function FamilyHistoryStep({ language }: FamilyHistoryStepProps) {
  const [editFamilyHistoryOpen, setEditFamilyHistoryOpen] = useState(false)
  const [selectedFamilyHistory, setSelectedFamilyHistory] = useState<any>(null)

  // Helper function to convert UPPERCASE_WITH_UNDERSCORES to Title Case With Spaces
  const formatRelationName = (relation: string): string => {
    return relation
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Use custom hook for data management
  const { 
    history: familyHistory, 
    loading: familyLoading, 
    error: familyError,
    refresh: refreshFamilyHistory
  } = useFamilyMedicalHistory()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Family Medical History</h2>
          <p className="text-sm text-muted-foreground">Record family medical conditions and history</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1 bg-transparent"
          onClick={() => {
            setSelectedFamilyHistory(null)
            setEditFamilyHistoryOpen(true)
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {familyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading family history...</span>
            </div>
          ) : familyError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading family history: {familyError}</p>
            </div>
          ) : !familyHistory || familyHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No family medical history recorded.</p>
              <p className="text-sm">Click Add to add your family medical history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {familyHistory.map((entry, index) => {
                const chronicDiseases = entry.chronic_diseases || []
                const isDeceased = entry.is_deceased || false
                
                return (
                  <div 
                    key={entry.id || index} 
                    className="p-4 border rounded-lg bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedFamilyHistory(entry)
                      setEditFamilyHistoryOpen(true)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base group-hover:text-blue-600 transition-colors">{formatRelationName(entry.relation)}</h3>
                      <Badge variant={isDeceased ? "secondary" : "default"}>
                        {isDeceased ? "Deceased" : "Alive"}
                      </Badge>
                    </div>
                    
                    {isDeceased ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        {entry.age_at_death && (
                          <p><span className="font-medium">Age at Death:</span> {entry.age_at_death}</p>
                        )}
                        {entry.cause_of_death && (
                          <p><span className="font-medium">Cause of Death:</span> {entry.cause_of_death}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {entry.current_age && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Current Age:</span> {entry.current_age}
                          </p>
                        )}
                        {chronicDiseases.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Chronic Diseases:</p>
                            <div className="space-y-1">
                              {chronicDiseases.map((disease: any, idx: number) => (
                                <div key={idx} className="text-sm text-muted-foreground pl-3">
                                  • {disease.disease} {disease.age_at_diagnosis && `(diagnosed at age ${disease.age_at_diagnosis})`}
                                  {disease.comments && <span className="text-xs italic"> - {disease.comments}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Legacy condition display for backward compatibility */}
                    {entry.condition && (
                      <div className="mt-2 text-sm text-muted-foreground border-t pt-2">
                        <p><span className="font-medium">Condition:</span> {entry.condition}</p>
                        {entry.ageOfOnset && <p><span className="font-medium">Age of Onset:</span> {entry.ageOfOnset}</p>}
                        {entry.outcome && <p><span className="font-medium">Outcome:</span> {entry.outcome}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family History Dialog */}
      <FamilyHistoryDialog 
        open={editFamilyHistoryOpen} 
        onOpenChange={(open) => {
          setEditFamilyHistoryOpen(open)
          if (!open) setSelectedFamilyHistory(null)
        }}
        onRefresh={refreshFamilyHistory}
        selectedEntry={selectedFamilyHistory}
        existingEntries={familyHistory || []}
      />
    </div>
  )
}