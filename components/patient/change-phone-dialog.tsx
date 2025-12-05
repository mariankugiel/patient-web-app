"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { appointmentsApiService } from "@/lib/api/appointments-api"

interface ChangePhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhone?: string | null
  appointmentId: string
  onSuccess?: () => void
}

export function ChangePhoneDialog({
  open,
  onOpenChange,
  currentPhone,
  appointmentId,
  onSuccess,
}: ChangePhoneDialogProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || "")
  const [isSaving, setIsSaving] = useState(false)

  // Update phone number when currentPhone prop changes
  useEffect(() => {
    setPhoneNumber(currentPhone || "")
  }, [currentPhone, open])

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.providePhoneNumber"),
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setIsSaving(true)
    try {
      await appointmentsApiService.updateAppointmentPhone(appointmentId, phoneNumber.trim())
      
      toast({
        title: t("appointments.phoneUpdated"),
        description: t("appointments.phoneUpdatedDescription"),
        duration: 3000,
      })
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating phone number:", error)
      toast({
        title: t("common.error"),
        description: t("appointments.phoneUpdateError"),
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("appointments.changePhoneNumber")}</DialogTitle>
          <DialogDescription>
            {t("appointments.changePhoneNumberDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t("common.phoneNumber")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t("common.phoneNumberPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("action.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("action.saving")}
              </>
            ) : (
              t("action.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

