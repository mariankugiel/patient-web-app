"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { PencilIcon } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function HistoryPage() {
  const { t } = useLanguage()
  const [editCurrentConditionsOpen, setEditCurrentConditionsOpen] = useState(false)
  const [editPastConditionsOpen, setEditPastConditionsOpen] = useState(false)
  const [editFamilyHistoryOpen, setEditFamilyHistoryOpen] = useState(false)

  // Medical conditions data
  const medicalConditions = {
    current: [
      {
        condition: t("health.conditions.hypertension"),
        diagnosedDate: t("health.dates.january2020"),
        treatedWith: "Lisinopril 10mg " + t("health.frequency.daily"),
        status: t("health.status.controlled"),
        notes: t("health.notes.bloodPressureImproved"),
      },
      {
        condition: t("health.conditions.hyperlipidemia"),
        diagnosedDate: t("health.dates.january2020"),
        treatedWith: "Atorvastatin 20mg " + t("health.frequency.daily"),
        status: t("health.status.partiallyControlled"),
        notes: t("health.notes.ldlElevated"),
      },
      {
        condition: t("health.conditions.type2Diabetes"),
        diagnosedDate: t("health.dates.february2020"),
        treatedWith: "Metformin 500mg " + t("health.frequency.twiceDaily") + ", " + t("health.treatment.dietExercise"),
        status: t("health.status.controlled"),
        notes: t("health.notes.glucoseNormalized"),
      },
    ],
    past: [
      {
        condition: t("health.conditions.acuteBronchitis"),
        diagnosedDate: t("health.dates.november2022"),
        treatedWith: t("health.treatment.antibioticsRest"),
        resolvedDate: t("health.dates.december2022"),
        notes: t("health.notes.fullyResolved"),
      },
      {
        condition: t("health.conditions.ankleSprainRight"),
        diagnosedDate: t("health.dates.june2021"),
        treatedWith: t("health.treatment.ricePhysicalTherapy"),
        resolvedDate: t("health.dates.august2021"),
        notes: t("health.notes.fullyHealed"),
      },
    ],
    family: [
      {
        condition: t("health.conditions.coronaryArteryDisease"),
        relation: t("health.relations.father"),
        ageOfOnset: "55",
        outcome: t("health.outcomes.managedMedicationStents"),
      },
      {
        condition: t("health.conditions.type2Diabetes"),
        relation: t("health.relations.mother"),
        ageOfOnset: "60",
        outcome: t("health.outcomes.managedMedicationDiet"),
      },
      {
        condition: t("health.conditions.hypertension"),
        relation: t("health.relations.fatherMother"),
        ageOfOnset: t("health.ageRanges.fifties"),
        outcome: t("health.outcomes.controlledMedication"),
      },
      {
        condition: t("health.conditions.breastCancer"),
        relation: t("health.relations.maternalAunt"),
        ageOfOnset: "62",
        outcome: t("health.outcomes.successfullyTreated"),
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("health.currentConditions")}</CardTitle>
              <CardDescription>{t("health.activeConditions")}</CardDescription>
            </div>
            <Dialog open={editCurrentConditionsOpen} onOpenChange={setEditCurrentConditionsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>{t("action.edit")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t("health.editCurrentConditions")}</DialogTitle>
                  <DialogDescription>{t("health.editCurrentConditionsDesc")}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="space-y-4 p-4">
                    {medicalConditions.current.map((condition, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">{t("health.condition")}</label>
                              <input
                                type="text"
                                defaultValue={condition.condition}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">{t("health.status")}</label>
                              <select
                                defaultValue={condition.status}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              >
                                <option value={t("health.status.controlled")}>{t("health.status.controlled")}</option>
                                <option value={t("health.status.partiallyControlled")}>
                                  {t("health.status.partiallyControlled")}
                                </option>
                                <option value={t("health.status.uncontrolled")}>
                                  {t("health.status.uncontrolled")}
                                </option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.treatment")}</label>
                            <input
                              type="text"
                              defaultValue={condition.treatedWith}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.notes")}</label>
                            <textarea
                              defaultValue={condition.notes}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditCurrentConditionsOpen(false)}>
                    {t("action.cancel")}
                  </Button>
                  <Button
                    onClick={() => {
                      alert(t("health.conditionsUpdated"))
                      setEditCurrentConditionsOpen(false)
                    }}
                  >
                    {t("action.save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicalConditions.current.map((condition, index) => (
                <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{condition.condition}</h3>
                    <Badge
                      variant={condition.status === t("health.status.controlled") ? "outline" : "secondary"}
                      className={
                        condition.status === t("health.status.controlled") ? "text-green-500" : "text-yellow-500"
                      }
                    >
                      {condition.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>
                      {t("health.diagnosed")}: {condition.diagnosedDate}
                    </p>
                    <p>
                      {t("health.treatment")}: {condition.treatedWith}
                    </p>
                    <p className="mt-1">{condition.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("health.pastConditions")}</CardTitle>
              <CardDescription>{t("health.resolvedConditions")}</CardDescription>
            </div>
            <Dialog open={editPastConditionsOpen} onOpenChange={setEditPastConditionsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>{t("action.edit")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t("health.editPastConditions")}</DialogTitle>
                  <DialogDescription>{t("health.editPastConditionsDesc")}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="space-y-4 p-4">
                    {medicalConditions.past.map((condition, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">{t("health.condition")}</label>
                              <input
                                type="text"
                                defaultValue={condition.condition}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">{t("health.resolvedDate")}</label>
                              <input
                                type="date"
                                defaultValue="2022-12-01"
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.treatment")}</label>
                            <input
                              type="text"
                              defaultValue={condition.treatedWith}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.notes")}</label>
                            <textarea
                              defaultValue={condition.notes}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditPastConditionsOpen(false)}>
                    {t("action.cancel")}
                  </Button>
                  <Button
                    onClick={() => {
                      alert(t("health.conditionsUpdated"))
                      setEditPastConditionsOpen(false)
                    }}
                  >
                    {t("action.save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicalConditions.past.map((condition, index) => (
                <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{condition.condition}</h3>
                    <Badge variant="outline" className="text-green-500">
                      {t("health.resolved")}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>
                      {t("health.diagnosed")}: {condition.diagnosedDate}
                    </p>
                    <p>
                      {t("health.resolved")}: {condition.resolvedDate}
                    </p>
                    <p>
                      {t("health.treatment")}: {condition.treatedWith}
                    </p>
                    <p className="mt-1">{condition.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("health.familyHistory")}</CardTitle>
            <CardDescription>{t("health.familyConditions")}</CardDescription>
          </div>
          <Dialog open={editFamilyHistoryOpen} onOpenChange={setEditFamilyHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                <PencilIcon className="h-3.5 w-3.5" />
                <span>{t("action.edit")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t("health.editFamilyHistory")}</DialogTitle>
                <DialogDescription>{t("health.editFamilyHistoryDesc")}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="space-y-4 p-4">
                  {medicalConditions.family.map((condition, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">{t("health.condition")}</label>
                            <input
                              type="text"
                              defaultValue={condition.condition}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.relation")}</label>
                            <select
                              defaultValue={condition.relation}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            >
                              <option value={t("health.relations.father")}>{t("health.relations.father")}</option>
                              <option value={t("health.relations.mother")}>{t("health.relations.mother")}</option>
                              <option value={t("health.relations.fatherMother")}>
                                {t("health.relations.fatherMother")}
                              </option>
                              <option value={t("health.relations.maternalAunt")}>
                                {t("health.relations.maternalAunt")}
                              </option>
                              <option value="Sibling">Sibling</option>
                              <option value="Grandparent">Grandparent</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">{t("health.ageOfOnset")}</label>
                            <input
                              type="text"
                              defaultValue={condition.ageOfOnset}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t("health.outcome")}</label>
                            <input
                              type="text"
                              defaultValue={condition.outcome}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditFamilyHistoryOpen(false)}>
                  {t("action.cancel")}
                </Button>
                <Button
                  onClick={() => {
                    alert(t("health.familyHistoryUpdated"))
                    setEditFamilyHistoryOpen(false)
                  }}
                >
                  {t("action.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {medicalConditions.family.map((condition, index) => (
              <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{condition.condition}</h3>
                  <span className="text-sm text-muted-foreground">
                    {t("health.ageOfOnset")}: {condition.ageOfOnset}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <p>
                    {t("health.relation")}: {condition.relation}
                  </p>
                  <p>
                    {t("health.outcome")}: {condition.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
