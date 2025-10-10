"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PencilIcon, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useCurrentMedicalConditions, usePastMedicalConditions, useFamilyMedicalHistory } from "@/hooks/use-medical-conditions"
import { useSurgeryHospitalization } from "@/hooks/use-surgery-hospitalization"
import { CurrentConditionsDialog } from "@/components/health-records/current-conditions-dialog"
import { PastConditionsDialog } from "@/components/health-records/past-conditions-dialog"
import { FamilyHistoryDialog } from "@/components/health-records/family-history-dialog"
import { SurgeriesHospitalizationsSection } from "@/components/health-records/surgeries-hospitalizations-section"

export default function HistoryPage() {
  const { t } = useLanguage()
  const [editCurrentConditionsOpen, setEditCurrentConditionsOpen] = useState(false)
  const [editPastConditionsOpen, setEditPastConditionsOpen] = useState(false)
  const [editFamilyHistoryOpen, setEditFamilyHistoryOpen] = useState(false)

  // Use custom hooks for data management
  const { 
    conditions: currentConditions, 
    loading: currentLoading, 
    error: currentError,
    refresh: refreshCurrentConditions
  } = useCurrentMedicalConditions()
  
  const { 
    conditions: pastConditions, 
    loading: pastLoading, 
    error: pastError,
    refresh: refreshPastConditions
  } = usePastMedicalConditions()
  
  const { 
    history: familyHistory, 
    loading: familyLoading, 
    error: familyError,
    refresh: refreshFamilyHistory
  } = useFamilyMedicalHistory()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("health.currentConditions")}</CardTitle>
              <CardDescription>{t("health.activeConditions")}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 bg-transparent"
              onClick={() => setEditCurrentConditionsOpen(true)}
            >
              <PencilIcon className="h-3.5 w-3.5" />
              <span>{t("action.edit")}</span>
            </Button>
          </CardHeader>
          <CardContent>
            {currentLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading current conditions...</span>
              </div>
            ) : currentError ? (
              <div className="text-center py-8 text-red-600">
                <p>Error loading current conditions: {currentError}</p>
              </div>
            ) : currentConditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No current medical conditions recorded.</p>
                <p className="text-sm">Click Edit to add your current conditions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentConditions.map((condition, index) => (
                  <div key={condition.id || index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{condition.condition}</h3>
                      <Badge
                        variant={condition.status === 'controlled' ? "outline" : "secondary"}
                        className={
                          condition.status === 'controlled' ? "text-green-500" : 
                          condition.status === 'partiallyControlled' ? "text-yellow-500" : "text-red-500"
                        }
                      >
                        {condition.status === 'controlled' ? t("health.status.controlled") :
                         condition.status === 'partiallyControlled' ? t("health.status.partiallyControlled") :
                         t("health.status.uncontrolled")}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {condition.diagnosedDate && (
                        <p>
                          {t("health.diagnosed")}: {condition.diagnosedDate}
                        </p>
                      )}
                      {condition.treatedWith && (
                        <p>
                          {t("health.treatment")}: {condition.treatedWith}
                        </p>
                      )}
                      {condition.notes && (
                        <p className="mt-1">{condition.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("health.pastConditions")}</CardTitle>
              <CardDescription>{t("health.resolvedConditions")}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 bg-transparent"
              onClick={() => setEditPastConditionsOpen(true)}
            >
              <PencilIcon className="h-3.5 w-3.5" />
              <span>{t("action.edit")}</span>
            </Button>
          </CardHeader>
          <CardContent>
            {pastLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading past conditions...</span>
              </div>
            ) : pastError ? (
              <div className="text-center py-8 text-red-600">
                <p>Error loading past conditions: {pastError}</p>
              </div>
            ) : pastConditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No past medical conditions recorded.</p>
                <p className="text-sm">Click Edit to add your past conditions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastConditions.map((condition, index) => (
                  <div key={condition.id || index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{condition.condition}</h3>
                      <Badge variant="outline" className="text-green-500">
                        {t("health.resolved")}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {condition.diagnosedDate && (
                        <p>
                          {t("health.diagnosed")}: {condition.diagnosedDate}
                        </p>
                      )}
                      {condition.resolvedDate && (
                        <p>
                          {t("health.resolved")}: {condition.resolvedDate}
                        </p>
                      )}
                      {condition.treatedWith && (
                        <p>
                          {t("health.treatment")}: {condition.treatedWith}
                        </p>
                      )}
                      {condition.notes && (
                        <p className="mt-1">{condition.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("health.familyHistory")}</CardTitle>
            <CardDescription>{t("health.familyConditions")}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1 bg-transparent"
            onClick={() => setEditFamilyHistoryOpen(true)}
          >
            <PencilIcon className="h-3.5 w-3.5" />
            <span>{t("action.edit")}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {familyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading family history...</span>
            </div>
          ) : familyError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading family history: {familyError}</p>
            </div>
          ) : familyHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No family medical history recorded.</p>
              <p className="text-sm">Click Edit to add your family medical history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {familyHistory.map((entry, index) => {
                const chronicDiseases = entry.chronic_diseases || []
                const isDeceased = entry.is_deceased || false
                
                return (
                  <div key={entry.id || index} className="border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base">{entry.relation}</h3>
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

      {/* Surgeries & Hospitalizations Section */}
      <SurgeriesHospitalizationsSection />

      {/* Dialog Components */}
      <CurrentConditionsDialog 
        open={editCurrentConditionsOpen} 
        onOpenChange={setEditCurrentConditionsOpen}
        onRefresh={refreshCurrentConditions}
      />
      <PastConditionsDialog 
        open={editPastConditionsOpen} 
        onOpenChange={setEditPastConditionsOpen}
        onRefresh={refreshPastConditions}
      />
      <FamilyHistoryDialog 
        open={editFamilyHistoryOpen} 
        onOpenChange={setEditFamilyHistoryOpen}
        onRefresh={refreshFamilyHistory}
      />
    </div>
  )
}
