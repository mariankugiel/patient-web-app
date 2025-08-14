"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Brain, PencilIcon, FileText, Dna, Stethoscope } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function GeneticsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("health.geneticAnalysis")}</CardTitle>
            <CardDescription>{t("health.geneticInsights")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
            <PencilIcon className="h-3.5 w-3.5" />
            <span>{t("action.edit")}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4 border border-muted mb-6">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
              <p className="text-sm">{t("health.geneticSummary")}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("health.healthRiskFactors")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.cardiovascularDisease")}</span>
                    <Badge variant="secondary">{t("health.elevatedRisk")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.type2Diabetes")}</span>
                    <Badge variant="outline">{t("health.averageRisk")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.hypertension")}</span>
                    <Badge variant="secondary">{t("health.elevatedRisk")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.alzheimersDisease")}</span>
                    <Badge variant="outline">{t("health.averageRisk")}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("health.medicationResponse")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.statins")}</span>
                    <Badge variant="outline">{t("health.normalResponse")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.betaBlockers")}</span>
                    <Badge variant="secondary">{t("health.reducedEfficacy")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.metformin")}</span>
                    <Badge variant="outline">{t("health.normalResponse")}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("health.ssris")}</span>
                    <Badge variant="outline">{t("health.normalResponse")}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">{t("health.geneticReports")}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <Dna className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{t("health.comprehensiveGeneticPanel")}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{t("health.dates.january152023")}</span>
                      <span>•</span>
                      <Stethoscope className="h-3 w-3" />
                      <span>GenomicHealth Labs</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FileText className="mr-1 h-4 w-4" />
                  {t("health.view")}
                </Button>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <Dna className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{t("health.pharmacogenomicAnalysis")}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{t("health.dates.january152023")}</span>
                      <span>•</span>
                      <Stethoscope className="h-3 w-3" />
                      <span>GenomicHealth Labs</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FileText className="mr-1 h-4 w-4" />
                  {t("health.view")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
