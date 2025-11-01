"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Smartphone, X, Lock, CheckCircle2, Circle } from "lucide-react"

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export default function SecurityTabPage() {
  const [accountSettings, setAccountSettings] = useState({ twoFactorAuth: true })
  const passwordForm = useForm<PasswordChangeFormValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } })
  const [newPasswordValue, setNewPasswordValue] = useState("")

  const passwordChecks = {
    minLength: newPasswordValue.length >= 8,
    hasLowercase: /[a-z]/.test(newPasswordValue),
    hasUppercase: /[A-Z]/.test(newPasswordValue),
    hasNumber: /[0-9]/.test(newPasswordValue),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPasswordValue),
    passwordsMatch: newPasswordValue === passwordForm.watch("confirmPassword") && newPasswordValue.length > 0,
  }

  const handleToggle = (key: keyof typeof accountSettings) => setAccountSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  const onSubmitPasswordChange = (data: PasswordChangeFormValues) => {
    console.log("password change:", data)
    passwordForm.reset()
    setNewPasswordValue("")
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text_base">Change Password</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update your password to keep your account secure</p>
            </div>
          </div>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-9 text-sm" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-9 text-sm" placeholder="••••••••" {...field} onChange={(e) => { field.onChange(e); setNewPasswordValue(e.target.value) }} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="h-9 text-sm" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>

              {newPasswordValue.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <p className="text-xs font-medium mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.minLength ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.minLength ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>At least 8 characters</span></div>
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.hasLowercase ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.hasLowercase ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>One lowercase letter</span></div>
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.hasUppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.hasUppercase ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>One uppercase letter</span></div>
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.hasNumber ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.hasNumber ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>One number</span></div>
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.hasSpecial ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.hasSpecial ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>One special character</span></div>
                    <div className="flex items-center gap-2 text-xs">{passwordChecks.passwordsMatch ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}<span className={passwordChecks.passwordsMatch ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>Passwords match</span></div>
                  </div>
                </div>
              )}

              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 text-xs">Update Password</Button>
            </form>
          </Form>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <div className="flex gap-0.5"><Lock className="h-4 w-4 text-primary" /><Lock className="h-4 w-4 text-primary" /></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Two-Factor Authentication</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-background p-2"><Smartphone className="h-4 w-4 text-muted-foreground" /></div>
              <div>
                <h4 className="font-medium text-sm">Authenticator App</h4>
                <p className="text-xs text-muted-foreground">Use an app to generate verification codes</p>
              </div>
            </div>
            <Switch checked={accountSettings.twoFactorAuth} onCheckedChange={() => handleToggle("twoFactorAuth")} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="20" height="14" x="2" y="7" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Active Sessions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage devices that are logged into your account</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="rounded-md bg-background p-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">Chrome on Windows</h4>
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.1 • Active now</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled className="h-7 text-xs flex-shrink-0 ml-2 bg-transparent">Current</Button>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="rounded-md bg-muted p-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <rect width="7" height="13" x="6" y="4" rx="1" />
                    <path d="M10.5 1.5v2M13.5 1.5v2M8 4v16M16 7h2M16 11h2M16 15h2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Safari on iPhone</h4>
                  <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.2 • 2 days ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 bg-transparent"><X className="mr-1 h-3 w-3" />Revoke</Button>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="rounded-md bg-muted p-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="21.17" x2="12" y1="8" y2="8" />
                    <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                    <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Firefox on MacBook</h4>
                  <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.5 • 5 days ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive hover;border-destructive/20 bg-transparent"><X className="mr-1 h-3 w-3" />Revoke</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


