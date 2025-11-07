"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { signupUser, loginUser, verifyMfaLogin } from "@/lib/features/auth/authThunks"
import { createClient } from "@/lib/supabase-client"
import { AuthApiService } from "@/lib/api/auth-api"
import { toast } from "react-toastify"
import { detectUserTimezone } from "@/lib/utils/timezone"
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  Circle
} from "lucide-react"
import { GoogleIcon, FacebookIcon, TwitterIcon, GitHubIcon } from "./social-icons"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: "login" | "signup"
}

export function AuthModal({ open, onOpenChange, defaultMode = "login" }: AuthModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">(defaultMode)
  const modeRef = useRef<"login" | "signup" | "forgot-password">(defaultMode)

  // Update mode when defaultMode changes
  useEffect(() => {
    setMode(defaultMode)
    modeRef.current = defaultMode
  }, [defaultMode])

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [isResetLoading, setIsResetLoading] = useState(false)
  
  // MFA verification state
  const [showMfaDialog, setShowMfaDialog] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaAccessToken, setMfaAccessToken] = useState<string | null>(null)
  const [mfaEmail, setMfaEmail] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Password validation checks
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    hasLowercase: /[a-z]/.test(formData.password),
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[^a-zA-Z0-9]/.test(formData.password),
    passwordsMatch: formData.password === formData.confirmPassword && formData.password.length > 0,
  }

  // Check if all password requirements are met (for signup)
  const isPasswordValid = 
    passwordChecks.minLength &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial &&
    passwordChecks.passwordsMatch

  // Check if signup form is valid
  const isSignupFormValid = 
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.confirmPassword.trim() !== "" &&
    isPasswordValid

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      const result = await dispatch(loginUser({ 
        email: formData.email, 
        password: formData.password 
      })).unwrap()
      
      // Check if MFA is required
      if (result && (result as any).mfa_required) {
        setMfaFactorId((result as any).factor_id)
        setMfaAccessToken((result as any).access_token)
        setMfaEmail((result as any).email || formData.email)
        setShowMfaDialog(true)
        // Don't close the modal and don't set isAuthenticated yet
        // Wait for MFA verification to complete
        return
      }
      
      // No MFA required - login is complete, close modal
      // The redirect will happen via useAuthRedirect hook when isAuthenticated becomes true
      onOpenChange(false)
    } catch (error: any) {
      // Redux thunks can reject with either Error objects or string values
      // Check if error is a string or has a message property
      const errorString = typeof error === 'string' ? error : (error?.message || String(error || ''))
      
      // Check if it's a connection error
      const isConnectionError = error?.code === 'ECONNABORTED' || 
                                error?.code === 'ERR_NETWORK' ||
                                error?.code === 'ECONNRESET' ||
                                error?.code === 'ECONNREFUSED' ||
                                errorString.includes('Connection failed') ||
                                errorString.includes('timeout') ||
                                errorString.includes('connection closed') ||
                                errorString.includes('Unable to connect') ||
                                errorString.includes('Unable to connect to the server') ||
                                errorString.includes('check if the backend is running')
      
      // Error handling is done in the Redux thunk (toast notification shown)
      // Only log non-connection errors to avoid console spam
      if (!isConnectionError) {
        console.error("Login error:", error)
      }
      // Connection errors are silently handled - toast already shown by thunk
    }
  }

  const handleMfaVerify = async () => {
    if (!mfaCode || !mfaFactorId || !mfaAccessToken) {
      toast.error("Please enter your verification code")
      return
    }

    try {
      await dispatch(verifyMfaLogin({
        factor_id: mfaFactorId,
        code: mfaCode,
        access_token: mfaAccessToken,
        email: mfaEmail,
      })).unwrap()
      
      // Close MFA dialog and main modal
      setShowMfaDialog(false)
      setMfaCode("")
      setMfaFactorId(null)
      setMfaAccessToken(null)
      setMfaEmail("")
      onOpenChange(false)
    } catch (err) {
      // Error is already handled by the thunk and shown via toast
      // No need to log - toast notification is sufficient
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Complex password validation
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (!/[a-z]/.test(formData.password)) {
      toast.error("Password must contain at least one lowercase letter")
      return
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error("Password must contain at least one uppercase letter")
      return
    }

    if (!/[0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one number")
      return
    }

    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one special character")
      return
    }

    try {
      // Auto-detect user's timezone
      const detectedTimezone = detectUserTimezone()
      
      await dispatch(signupUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
        timezone: detectedTimezone,
      })).unwrap()
      onOpenChange(false)
    } catch (error: any) {
      // Error handling is done in the Redux thunk, no need to show duplicate notification
      console.error("Signup error:", error)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error("Please enter your email address")
      return
    }

    setIsResetLoading(true)
    
    try {
      await AuthApiService.resetPassword(formData.email)
      toast.success("Password reset email sent! Check your inbox.")
      setMode("login") // Return to login mode
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email")
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github" | "facebook" | "twitter") => {
    setIsOAuthLoading(provider)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        toast.error(`Failed to sign in with ${provider}`)
      }
    } catch (error: any) {
      toast.error(`Failed to sign in with ${provider}`)
    } finally {
      setIsOAuthLoading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  }

  const switchMode = (newMode: "login" | "signup" | "forgot-password") => {
    setMode(newMode)
    modeRef.current = newMode
    resetForm()
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <div className="relative">

          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {mode === "login" ? "Welcome back" : 
                 mode === "signup" ? "Create your account" : 
                 "Reset your password"}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {mode === "login" 
                  ? "Sign in to your account to continue" 
                  : mode === "signup"
                  ? "Join thousands of users managing their health"
                  : "Enter your email address and we'll send you a link to reset your password"
                }
              </p>
            </DialogHeader>
          </div>


          {/* Form */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={(e) => {
                  const currentMode = modeRef.current
                  if (currentMode === "login") {
                    handleLogin(e)
                  } else if (currentMode === "signup") {
                    handleSignup(e)
                  } else if (currentMode === "forgot-password") {
                    handleForgotPassword(e)
                  }
                }}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={mode === "forgot-password" ? "Enter your email address" : "Enter your email"}
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {mode !== "forgot-password" && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === "login" ? "Enter your password" : "Create a strong password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 w-10 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {mode === "signup" && formData.password && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium mb-2">Password Requirements:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.minLength ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={passwordChecks.minLength ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasLowercase ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={passwordChecks.hasLowercase ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}>
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasUppercase ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={passwordChecks.hasUppercase ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}>
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasNumber ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={passwordChecks.hasNumber ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}>
                              One number
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasSpecial ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className={passwordChecks.hasSpecial ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}>
                              One special character
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 w-10 p-0 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {formData.confirmPassword && (
                      <div className="flex items-center gap-2 text-xs">
                        {passwordChecks.passwordsMatch ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            <span className="text-green-600 dark:text-green-500">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-500 dark:text-gray-400">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    mode === "login" 
                      ? isLoading 
                      : mode === "signup" 
                        ? isLoading || !isSignupFormValid
                        : isResetLoading
                  }
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {mode === "login" && isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : mode === "signup" && isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : mode === "forgot-password" && isResetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending reset email...
                    </>
                  ) : (
                    mode === "login" ? "Sign In" : 
                    mode === "signup" ? "Create Account" : 
                    "Send Reset Email"
                  )}
                </Button>

                {/* Forgot Password Link - Only show in login mode */}
                {mode === "login" && (
                  <div className="text-center mt-3">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-gray-500 hover:text-teal-600"
                      onClick={() => switchMode("forgot-password")}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                )}

                {/* Back to Login Link - Only show in forgot password mode */}
                {mode === "forgot-password" && (
                  <div className="text-center mt-3">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-gray-500 hover:text-teal-600"
                      onClick={() => switchMode("login")}
                    >
                      Back to login
                    </Button>
                  </div>
                )}
              </motion.form>
            </AnimatePresence>

            {/* OAuth Section - Only show for login and signup modes */}
            {mode !== "forgot-password" && (
              <div className="mt-6">
                <div className="relative mb-6">
                  <Separator className="bg-gray-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-3 text-sm font-medium text-gray-600">Or continue with</span>
                  </div>
                </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  className="w-11 h-11 p-0 border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isOAuthLoading === "google"}
                  title="Continue with Google"
                >
                  {isOAuthLoading === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-11 h-11 p-0 border-gray-200 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:shadow-md"
                  onClick={() => handleOAuthLogin("github")}
                  disabled={isOAuthLoading === "github"}
                  title="Continue with GitHub"
                >
                  {isOAuthLoading === "github" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitHubIcon className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-11 h-11 p-0 border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                  onClick={() => handleOAuthLogin("facebook")}
                  disabled={isOAuthLoading === "facebook"}
                  title="Continue with Facebook"
                >
                  {isOAuthLoading === "facebook" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FacebookIcon className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-11 h-11 p-0 border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                  onClick={() => handleOAuthLogin("twitter")}
                  disabled={isOAuthLoading === "twitter"}
                  title="Continue with Twitter"
                >
                  {isOAuthLoading === "twitter" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TwitterIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              </div>
            )}

            {/* Mode Switch - Only show for login and signup modes */}
            {mode !== "forgot-password" && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                  <span className="mx-2 text-gray-400">•</span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-teal-600 hover:text-teal-700 font-medium ml-1"
                    onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* MFA Verification Dialog */}
    <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Please enter the verification code from your authenticator app to complete login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Verification Code</Label>
            <Input
              id="mfa-code"
              type="text"
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mfaCode.length === 6 && !isLoading) {
                  handleMfaVerify()
                }
              }}
              maxLength={6}
              disabled={isLoading}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowMfaDialog(false)
              setMfaCode("")
              setMfaFactorId(null)
              setMfaAccessToken(null)
              setMfaEmail("")
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMfaVerify}
            disabled={isLoading || !mfaCode || mfaCode.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
