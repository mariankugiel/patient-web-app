"use client"

import { useState, useEffect, useCallback } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Smartphone, X, Lock, CheckCircle2, Circle } from "lucide-react"
import { toast } from "react-toastify"
import { AuthApiService } from "@/lib/api/auth-api"
import { enrollMFA, verifyMFAEnrollment, listMFAFactors, unenrollMFAFactor } from "@/lib/auth-helpers"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { createClient } from "@/lib/supabase-client"
import { TOTP } from 'otpauth'

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
  const { isRestoringSession, isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [accountSettings, setAccountSettings] = useState({ twoFactorAuth: false })
  const [mfaFactors, setMfaFactors] = useState<Array<{id: string, type: string, friendly_name: string, status: string, created_at: string}>>([])
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [enrollmentFactorId, setEnrollmentFactorId] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const passwordForm = useForm<PasswordChangeFormValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } })
  const [newPasswordValue, setNewPasswordValue] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoadingMFA, setIsLoadingMFA] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [isDisabling2FA, setIsDisabling2FA] = useState(false)

  const passwordChecks = {
    minLength: newPasswordValue.length >= 8,
    hasLowercase: /[a-z]/.test(newPasswordValue),
    hasUppercase: /[A-Z]/.test(newPasswordValue),
    hasNumber: /[0-9]/.test(newPasswordValue),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPasswordValue),
    passwordsMatch: newPasswordValue === passwordForm.watch("confirmPassword") && newPasswordValue.length > 0,
  }

  // Wait for session restoration and check Supabase session
  useEffect(() => {
    const checkSession = async () => {
      // Wait for Redux session restoration to complete
      if (isRestoringSession) {
        return
      }

      // Check if Supabase session exists
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsSessionReady(true)
        } else {
          // If no session but we have tokens, try to restore it
          const storedToken = localStorage.getItem('access_token')
          const refreshToken = localStorage.getItem('refresh_token')
          if (storedToken && refreshToken && isAuthenticated) {
            try {
              const sessionResult = await supabase.auth.setSession({
                access_token: storedToken,
                refresh_token: refreshToken,
              })
              if (!sessionResult.error) {
                setIsSessionReady(true)
              }
            } catch (error) {
              console.warn('Failed to restore Supabase session in security page:', error)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to check Supabase session:', error)
      }
    }

    checkSession()
  }, [isRestoringSession, isAuthenticated])

  const loadMFAFactors = useCallback(async () => {
    try {
      const { data, error } = await listMFAFactors()
      if (error) throw error
      // listFactors returns { all: Factor[], totp: Factor[], phone: Factor[] }
      const factors = data?.all || []
      
      // Log factor data to see what's available
      if (factors.length > 0) {
        console.log('📋 Loaded MFA factors:', JSON.stringify(factors, null, 2))
        
        // Check if factors contain secret data
        factors.forEach((factor: any, index: number) => {
          console.log(`📋 Factor ${index}:`, {
            id: factor.id,
            type: factor.type,
            status: factor.status,
            friendly_name: factor.friendly_name,
            hasTotp: !!factor.totp,
            totpKeys: factor.totp ? Object.keys(factor.totp) : [],
            hasSecret: !!(factor.totp?.secret || factor.secret || (factor as any).secret),
            allKeys: Object.keys(factor)
          })
        })
      }
      
      setMfaFactors(factors as any)
      setAccountSettings({ twoFactorAuth: factors.length > 0 })
    } catch (error: any) {
      console.error("Error loading MFA factors:", error)
    }
  }, [])

  useEffect(() => {
    if (isSessionReady) {
      loadMFAFactors()
    }
  }, [isSessionReady, loadMFAFactors])

  // Function to generate and log current TOTP code
  const generateAndLogTOTPCode = useCallback((secret: string) => {
    try {
      // Create TOTP instance - Supabase uses standard TOTP (SHA1, 6 digits, 30 seconds)
      // The secret should be base32 encoded string (otpauth library handles this)
      const totp = new TOTP({
        issuer: 'YourHealth1Place',
        label: '2FA',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret // otpauth library expects base32 encoded secret
      })
      
      const currentCode = totp.generate()
      const timestamp = Math.floor(Date.now() / 1000)
      const timeRemaining = 30 - (timestamp % 30)
      const currentTimeWindow = Math.floor(timestamp / 30)
      
      // Always log to console - this is what the user wants to see
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔐 CURRENT TOTP CODE:', currentCode)
      console.log('🔐 Expected TOTP Code (from secret):', currentCode)
      console.log('⏰ Code expires in:', timeRemaining, 'seconds')
      console.log('🕐 Current time window:', currentTimeWindow)
      console.log('📋 Secret (first/last 4):', secret.substring(0, 8) + '...' + secret.substring(secret.length - 4))
      console.log('📋 Full secret length:', secret.length)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Also log a simple, easy-to-spot line
      console.log('')
      console.log('═══════════════════════════════════════════')
      console.log('  🔐 EXPECTED CODE: ' + currentCode + ' (expires in ' + timeRemaining + 's)')
      console.log('═══════════════════════════════════════════')
      console.log('')
    } catch (err) {
      console.error('❌ Error generating TOTP code:', err)
      console.error('Secret that failed:', secret?.substring(0, 20) + '...')
    }
  }, [])

  const handleToggle2FA = async (enabled: boolean) => {
    setIsLoadingMFA(true)
    try {
      if (enabled) {
        // Explicitly keep switch disabled until verification succeeds
        setAccountSettings({ twoFactorAuth: false })
        
        // Get user's first name for the authenticator label
        const userFullName = user?.user_metadata?.full_name || ""
        const firstName = userFullName.split(' ')[0] || "User"
        const friendlyName = `${firstName}-authenticator`
        
        // Start enrollment process
        const { data, error } = await enrollMFA(friendlyName)
        if (error) throw error
        if (!data) throw new Error("No enrollment data returned")
        
        // Log full enrollment data for debugging
        console.log('📦 Full enrollment data:', JSON.stringify(data, null, 2))
        console.log('📦 Enrollment data type check:', {
          hasData: !!data,
          dataKeys: Object.keys(data || {}),
          hasTotp: !!data?.totp,
          totpKeys: data?.totp ? Object.keys(data.totp) : [],
          qrCodeType: typeof data?.totp?.qr_code,
          qrCodeSample: data?.totp?.qr_code?.substring(0, 50)
        })
        
        // Extract secret from enrollment data
        // The secret is in data.totp.secret or can be extracted from QR code URL
        let secret: string | null = data.totp?.secret || null
        console.log('🔑 Direct secret from data.totp.secret:', secret ? secret.substring(0, 8) + '...' : 'null')
        
        if (!secret && data.totp?.qr_code) {
          // Try to extract from QR code URL (otpauth://totp/...?secret=XXXXX)
          try {
            // QR code might be a data URL or a string URL
            let qrCodeUrlString = data.totp.qr_code
            // If it's a data URL (data:image/png;base64,...) we need to extract the otpauth URL differently
            if (qrCodeUrlString.startsWith('data:')) {
              console.warn('QR code is a data URL, cannot extract secret from it directly')
            } else {
              const url = new URL(qrCodeUrlString)
              secret = url.searchParams.get('secret')
              console.log('📎 Extracted secret from QR URL:', secret ? secret.substring(0, 8) + '...' : 'null')
            }
          } catch (e) {
            console.warn('Could not extract secret from QR code URL:', e)
            console.log('QR code value:', data.totp.qr_code?.substring(0, 100))
          }
        }
        
        if (secret) {
          console.log('✅ Secret found:', secret.substring(0, 8) + '...' + secret.substring(secret.length - 4))
          setTotpSecret(secret)
          // Store secret in localStorage for later use (when disabling)
          if (typeof window !== 'undefined') {
            localStorage.setItem('mfa_totp_secret', secret)
            localStorage.setItem('mfa_factor_id', data.id)
            console.log('💾 Secret stored in localStorage for future disabling:', {
              secretLength: secret.length,
              factorId: data.id
            })
          }
          // Generate and log current TOTP code immediately
          generateAndLogTOTPCode(secret)
          
          // Generate custom QR code with issuer "Saluso" instead of localhost:3000
          // Format: otpauth://totp/ISSUER:LABEL?secret=SECRET&issuer=ISSUER
          const customLabel = `${firstName}-authenticator`
          const customOtpauthUrl = `otpauth://totp/Saluso:${encodeURIComponent(customLabel)}?secret=${secret}&issuer=Saluso&algorithm=SHA1&digits=6&period=30`
          
          // Generate QR code from the custom otpauth URL
          try {
            // Import qrcode dynamically (uses named exports)
            const QRCode = await import('qrcode')
            const qrCodeDataUrl = await QRCode.toDataURL(customOtpauthUrl, {
              width: 256,
              margin: 2,
              errorCorrectionLevel: 'M'
            })
            setQrCodeUrl(qrCodeDataUrl)
            console.log('✅ Generated custom QR code with issuer "Saluso"')
          } catch (qrError) {
            console.warn('Failed to generate custom QR code, using Supabase QR code:', qrError)
            // Fallback to Supabase QR code if custom generation fails
            setQrCodeUrl(data.totp?.qr_code || "")
          }
        } else {
          console.warn('❌ No secret found in enrollment data')
          console.log('Available data keys:', Object.keys(data || {}))
          console.log('data.totp keys:', data?.totp ? Object.keys(data.totp) : 'no totp')
          // Use Supabase QR code if no secret
          setQrCodeUrl(data.totp?.qr_code || "")
        }
        
        setEnrollmentFactorId(data.id)
        setShowQRCode(true)
        // Keep switch disabled - only enable after successful verification
      } else {
        // Disable 2FA - requires verification code for verified factors
        // Check if we have verified factors that require AAL2
        const verifiedFactors = mfaFactors.filter(f => f.status === 'verified')
        
        if (verifiedFactors.length > 0) {
          const currentFactor = verifiedFactors[0]
          
          // First, try to get secret from the factor object itself (like when enabling)
          let secretFromFactor: string | null = null
          
          // Check multiple possible locations in the factor object
          if ((currentFactor as any).totp?.secret) {
            secretFromFactor = (currentFactor as any).totp.secret
            console.log('✅ Found secret in factor.totp.secret')
          } else if ((currentFactor as any).secret) {
            secretFromFactor = (currentFactor as any).secret
            console.log('✅ Found secret in factor.secret')
          } else if ((currentFactor as any).qr_code) {
            // Try to extract from QR code URL
            try {
              const qrCodeUrl = (currentFactor as any).qr_code
              if (typeof qrCodeUrl === 'string' && qrCodeUrl.startsWith('otpauth://')) {
                const url = new URL(qrCodeUrl)
                secretFromFactor = url.searchParams.get('secret')
                if (secretFromFactor) {
                  console.log('✅ Extracted secret from factor.qr_code URL')
                }
              }
            } catch (e) {
              console.warn('Could not extract secret from factor QR code:', e)
            }
          }
          
          // If no secret from factor, try localStorage
          let storedSecret: string | null = null
          if (!secretFromFactor && typeof window !== 'undefined') {
            // Log all localStorage keys that start with 'mfa' for debugging
            const allMfaKeys = Object.keys(localStorage).filter(key => key.includes('mfa'))
            console.log('🔍 All MFA-related localStorage keys:', allMfaKeys)
            
            storedSecret = localStorage.getItem('mfa_totp_secret')
            const storedFactorId = localStorage.getItem('mfa_factor_id')
            
            console.log('🔍 Checking stored secret for disabling:', {
              hasStoredSecret: !!storedSecret,
              storedSecretLength: storedSecret?.length,
              storedFactorId,
              currentFactorId: currentFactor.id,
              factorsMatch: storedFactorId === currentFactor.id,
              allMfaKeys
            })
          }
          
          // Use secret from factor first, then fall back to localStorage
          const secretToUse = secretFromFactor || storedSecret
          
          if (secretToUse) {
            console.log('✅ Using secret for code generation:', {
              source: secretFromFactor ? 'factor object' : 'localStorage',
              secretLength: secretToUse.length
            })
            setTotpSecret(secretToUse)
            // Generate and log current TOTP code immediately for disabling
            generateAndLogTOTPCode(secretToUse)
            
            // If we got it from factor, also store it in localStorage for future use
            if (secretFromFactor && typeof window !== 'undefined') {
              localStorage.setItem('mfa_totp_secret', secretFromFactor)
              localStorage.setItem('mfa_factor_id', currentFactor.id)
              console.log('💾 Stored secret from factor in localStorage')
            }
          } else {
            console.warn('⚠️ No secret found - neither in factor object nor localStorage', {
              factorData: currentFactor,
              factorKeys: Object.keys(currentFactor as any)
            })
            setTotpSecret(null)
          }
          
          // Show dialog to get verification code for disabling
          setIsDisabling2FA(true)
          setEnrollmentFactorId(verifiedFactors[0].id) // Use first verified factor
          setQrCodeUrl("") // Clear QR code since we're disabling, not enabling
          // Open dialog AFTER setting secret so useEffect can catch both
          setShowQRCode(true) // Reuse the QR dialog for verification input
        } else {
          // No verified factors, can unenroll directly
          for (const factor of mfaFactors) {
            const { error } = await unenrollMFAFactor(factor.id)
            if (error) throw error
          }
          setMfaFactors([])
          setAccountSettings({ twoFactorAuth: false })
          toast.success("Two-factor authentication has been disabled.")
        }
      }
      } catch (error: any) {
        console.error("Error toggling 2FA:", error)
        
        // If disabling 2FA, keep switch enabled on error (user hasn't successfully disabled)
        if (!enabled) {
          setAccountSettings({ twoFactorAuth: true })
        } else {
          // If enabling 2FA, keep switch disabled on error
          setAccountSettings({ twoFactorAuth: false })
        }
        
        toast.error(error.message || "Failed to toggle 2FA. Please try again.")
      } finally {
        setIsLoadingMFA(false)
      }
    }

  const handleVerifyEnrollment = async () => {
    setIsLoadingMFA(true)
    try {
      
      if (isDisabling2FA) {
        // Disable 2FA - verify code and unenroll
        const { error } = await unenrollMFAFactor(enrollmentFactorId, verificationCode)
        if (error) throw error
        
        // Clear state
        setShowQRCode(false)
        setVerificationCode("")
        setEnrollmentFactorId("")
        setQrCodeUrl("")
        setIsDisabling2FA(false)
        setTotpSecret(null)
        
        // Clear stored secret from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mfa_totp_secret')
          localStorage.removeItem('mfa_factor_id')
        }
        
        toast.success("Two-factor authentication has been disabled successfully.")
        
        // Reload factors - this will update accountSettings.twoFactorAuth
        await loadMFAFactors()
      } else {
        // Enable 2FA - verify enrollment
        const { error } = await verifyMFAEnrollment(enrollmentFactorId, verificationCode)
        if (error) throw error
        
        // Only enable 2FA after successful verification
        setShowQRCode(false)
        setVerificationCode("")
        setEnrollmentFactorId("")
        setQrCodeUrl("")
        setTotpSecret(null) // Clear secret after successful verification
        
        toast.success("Two-factor authentication has been enabled successfully.")
        
        // Reload factors - this will update accountSettings.twoFactorAuth based on actual factors
        await loadMFAFactors()
      }
    } catch (error: any) {
      // Handle switch state based on whether we're enabling or disabling
      if (isDisabling2FA) {
        // If disabling fails, keep switch enabled (2FA is still active)
        setAccountSettings({ twoFactorAuth: true })
      } else {
        // If enabling fails, keep switch disabled
        setAccountSettings({ twoFactorAuth: false })
      }
      
      // Check multiple possible locations for error status and message
      // Supabase errors can have different structures
      const errorObj = error || {}
      const errorMessage = String(
        errorObj.message || 
        errorObj.originalError?.message || 
        errorObj.msg || 
        errorObj.error?.message ||
        ""
      ).toLowerCase()
      
      // Check for 422 status in multiple locations
      const errorStatus = 
        errorObj.status || 
        errorObj.originalError?.status || 
        errorObj.statusCode ||
        errorObj.response?.status ||
        errorObj.error?.status ||
        (errorObj as any)?.status
      
      // Check if it's a 422 error (Unprocessable Content) - Invalid TOTP code
      const is422Error = errorStatus === 422 || String(errorStatus) === "422" || errorStatus === "422"
      const hasInvalidCodeMessage = 
        errorMessage.includes("invalid totp code") || 
        errorMessage.includes("invalid code") ||
        errorMessage.includes("invalid totp") ||
        errorMessage.includes("unprocessable content") ||
        errorMessage.includes("422")
      
      // Show notification - prioritize 422 errors as "Invalid Verification Code"
      if (is422Error || hasInvalidCodeMessage) {
        // Always show notification for 422/invalid code errors
        toast.error("Invalid verification code. The code you entered is incorrect. Please try again.")
      } else {
        // For other errors, show the error message
        const displayMessage = errorObj.message || 
                              errorObj.originalError?.message || 
                              errorObj.error?.message ||
                              "An error occurred during verification. Please try again."
        
        // If error message suggests invalid code, use that title
        const isLikelyInvalidCode = String(displayMessage).toLowerCase().includes("code") ||
                                    String(displayMessage).toLowerCase().includes("totp") ||
                                    String(displayMessage).toLowerCase().includes("invalid")
        
        toast.error(displayMessage)
      }
      
      // Clear the verification code input so user can try again
      setVerificationCode("")
      
      // Don't clean up the enrollment on first failure - let user try again
      // Only clean up if they explicitly cancel or close the dialog
      // Switch is explicitly kept disabled above
    } finally {
      setIsLoadingMFA(false)
    }
  }

  const handleDialogClose = async (open: boolean) => {
    if (!open && enrollmentFactorId && showQRCode) {
      // User closed dialog without verifying
      setIsLoadingMFA(true)
      try {
        if (isDisabling2FA) {
          // User canceled disabling 2FA - reset state and keep switch enabled
          setIsDisabling2FA(false)
          setAccountSettings({ twoFactorAuth: true })
        } else {
          // User closed enrollment dialog - clean up the unverified enrollment
          await unenrollMFAFactor(enrollmentFactorId)
        }
      } catch (error) {
        console.error("Error cleaning up on dialog close:", error)
      } finally {
        setEnrollmentFactorId("")
        setQrCodeUrl("")
        setVerificationCode("")
        setTotpSecret(null)
        setIsDisabling2FA(false)
        setIsLoadingMFA(false)
        
        // Clear stored secret if canceling enrollment (not disabling)
        if (!isDisabling2FA && typeof window !== 'undefined') {
          localStorage.removeItem('mfa_totp_secret')
          localStorage.removeItem('mfa_factor_id')
        }
      }
    }
    setShowQRCode(open)
  }

  const handleToggle = (key: keyof typeof accountSettings) => setAccountSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  // Set up interval to log current code every 5 seconds while dialog is open
  // Works for both enabling and disabling 2FA
  useEffect(() => {
    console.log('🔔 useEffect triggered:', { hasSecret: !!totpSecret, showQRCode, isDisabling2FA })
    
    if (totpSecret && showQRCode) {
      console.log('✅ Starting TOTP code logging interval')
      // Log immediately
      generateAndLogTOTPCode(totpSecret)
      
      // Then log every 5 seconds
      const interval = setInterval(() => {
        console.log('🔄 Interval tick - generating TOTP code')
        generateAndLogTOTPCode(totpSecret)
      }, 5000)
      
      return () => {
        console.log('🧹 Cleaning up TOTP code interval')
        clearInterval(interval)
      }
    } else {
      console.log('⚠️ Not starting interval:', { hasSecret: !!totpSecret, showQRCode })
    }
    
    // Clear secret when dialog closes (but keep it in localStorage for disabling)
    // Only clear from state, not from localStorage unless explicitly cleared
  }, [totpSecret, showQRCode, generateAndLogTOTPCode, isDisabling2FA])

  const onSubmitPasswordChange = async (data: PasswordChangeFormValues) => {
    console.log("password change:", data)
    setIsChangingPassword(true)
    
    try {
      await AuthApiService.changePassword(data.currentPassword, data.newPassword)
      
      toast.success("Your password has been updated successfully.")
      
      passwordForm.reset()
      setNewPasswordValue("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.message || "Failed to change password. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
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

              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 text-xs" disabled={isChangingPassword}>
                {isChangingPassword ? "Changing..." : "Update Password"}
              </Button>
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
            <Switch checked={accountSettings.twoFactorAuth} onCheckedChange={handleToggle2FA} disabled={isLoadingMFA} />
          </div>
        </div>

        <Dialog open={showQRCode} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isDisabling2FA ? "Disable Two-Factor Authentication" : "Scan QR Code"}
              </DialogTitle>
              <DialogDescription>
                {isDisabling2FA 
                  ? "Enter your current verification code to disable two-factor authentication."
                  : "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {!isDisabling2FA && qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded-lg" />
              )}
              <Input 
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="w-full text-center text-lg tracking-widest"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyEnrollment} disabled={verificationCode.length !== 6 || isLoadingMFA}>
                {isLoadingMFA 
                  ? (isDisabling2FA ? "Disabling..." : "Verifying...")
                  : (isDisabling2FA ? "Disable 2FA" : "Verify")
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
