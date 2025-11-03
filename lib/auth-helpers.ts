import { createClient } from "./supabase-client"

// Client-side auth helpers
export async function signUp(email: string, password: string, userData?: any) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

// Note: Server-side auth helpers should be in a separate file for server components

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  return { data, error }
}

// MFA Helpers
async function ensureSupabaseSession(supabase: ReturnType<typeof createClient>) {
  // Check if we have a session
  const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
  
  if (sessionCheckError) {
    throw new Error(`Failed to check session: ${sessionCheckError.message}`)
  }
  
  if (!session) {
    // Try to restore session from localStorage
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
    
    if (storedToken && refreshToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: storedToken,
        refresh_token: refreshToken,
      })
      
      if (sessionError) {
        throw new Error(`Failed to restore session: ${sessionError.message}`)
      }
      
      // Verify session was set successfully
      if (!sessionData?.session) {
        throw new Error('Failed to restore session: No session data returned')
      }
    } else {
      throw new Error('No active session found. Please log in again.')
    }
  }
  
  // Verify we have a valid session with access token
  const { data: { session: verifiedSession } } = await supabase.auth.getSession()
  if (!verifiedSession?.access_token) {
    throw new Error('Session is missing access token. Please log in again.')
  }
}

export async function enrollMFA(friendlyName?: string) {
  const supabase = createClient()
  const defaultName = friendlyName || 'My Authenticator App'
  
  try {
    // Ensure we have a valid session before making MFA calls
    await ensureSupabaseSession(supabase)
    
    // First, check for existing factors and clean up any unverified ones
    const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors()
    
    if (!listError && factorsData) {
      // Check for existing factors with the same friendly name
      const existingFactors = factorsData.all || []
      const matchingFactors = existingFactors.filter(
        (factor: any) => factor.friendly_name === defaultName
      )
      
      // Clean up any unverified factors with the same name
      for (const factor of matchingFactors) {
        // Check if factor is verified - unverified factors typically have status 'unverified'
        // or we can check if it's in the verified factors list
        const verifiedFactors = factorsData.totp || []
        const isVerified = verifiedFactors.some((vf: any) => vf.id === factor.id)
        
        if (!isVerified) {
          // Unverified factor - clean it up
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }
    }
    
    // Now enroll a new factor
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: defaultName
    })
    
    return { data, error }
  } catch (error: any) {
    // If error is about existing factor, try to clean it up and retry once
    if (error?.message && error.message.includes('already exists')) {
      try {
        // List factors again and remove the conflicting one
        const { data: factorsData } = await supabase.auth.mfa.listFactors()
        if (factorsData) {
          const existingFactors = factorsData.all || []
          const matchingFactors = existingFactors.filter(
            (factor: any) => factor.friendly_name === defaultName
          )
          
          for (const factor of matchingFactors) {
            await supabase.auth.mfa.unenroll({ factorId: factor.id })
          }
          
          // Retry enrollment
          const { data, error: retryError } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: defaultName
          })
          return { data, error: retryError }
        }
      } catch (retryError: any) {
        return { data: null, error: retryError instanceof Error ? retryError : new Error(String(retryError)) }
      }
    }
    
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function verifyMFAEnrollment(factorId: string, code: string) {
  const supabase = createClient()
  
  try {
    // Ensure we have a valid session before making MFA calls
    await ensureSupabaseSession(supabase)
    
    // Validate code format first
    const codeString = String(code).trim()
    if (codeString.length !== 6 || !/^\d{6}$/.test(codeString)) {
      return { 
        data: null, 
        error: new Error("Invalid code format. Please enter a 6-digit code.") 
      }
    }
    
    // For enrollment verification, we MUST use the challenge flow
    // Note: The code must be from the CURRENT time window when verification happens
    // Create challenge first, then verify with current code
    
    // Fallback: Create challenge and verify separately
    // Step 1: Create a challenge for the factor
    const challengeStartTime = Date.now()
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    })
    
    if (challengeError) {
      // Provide more helpful error message
      let errorMessage = challengeError.message || "Failed to create verification challenge"
      if (challengeError.message?.includes("422") || challengeError.status === 422) {
        errorMessage = "Failed to create challenge. The factor may already be verified or invalid. Please try disabling and re-enabling 2FA."
      }
      return { data: null, error: new Error(errorMessage) }
    }
    
    if (!challengeData || !challengeData.id) {
      return { data: null, error: new Error("Failed to create challenge. Please try again.") }
    }
    
    const challengeDuration = Date.now() - challengeStartTime
    console.log(`⏱️ Challenge created in ${challengeDuration}ms`)
    
    // Step 2: Verify IMMEDIATELY after creating challenge
    // Critical: Supabase can reject codes if more than 3 seconds pass since code change
    const verifyTimestamp = Date.now()
    console.log('🔍 Verifying MFA (immediately after challenge):', {
      factorId,
      challengeId: challengeData.id,
      code: codeString,
      codeLength: codeString.length,
      timestamp: new Date().toISOString(),
      timeSinceChallengeCreated: `${challengeDuration}ms`
    })
    
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: codeString
    })
    
    const verifyDuration = Date.now() - verifyTimestamp
    const totalDuration = Date.now() - challengeStartTime
    console.log(`⏱️ Verification completed in ${verifyDuration}ms (total: ${totalDuration}ms)`)
    
    // If verify fails, return detailed error
    if (error) {
      // Log full error details for debugging
      console.error("Supabase MFA verify error:", {
        message: error.message,
        status: error.status,
        error: error,
        factorId,
        challengeId: challengeData.id,
        codeLength: codeString.length
      })
      
      // Extract the actual error message from Supabase response
      let errorMessage = "Verification failed"
      
      // Try to get the actual error message from various sources
      if (error.message) {
        errorMessage = error.message
      } else if ((error as any).msg) {
        errorMessage = (error as any).msg
      } else if (error.status) {
        errorMessage = `Verification failed with status ${error.status}`
      }
      
      // Provide more specific error message based on the error type
      if (errorMessage.toLowerCase().includes("invalid totp code") || 
          errorMessage.toLowerCase().includes("invalid code") ||
          errorMessage.toLowerCase().includes("code is invalid")) {
        errorMessage = "Invalid verification code. Please check your authenticator app and ensure your device time is correct. Try entering a fresh code."
      } else if (errorMessage.includes("expired") || errorMessage.includes("timeout")) {
        errorMessage = "The verification code has expired. Please enter a fresh code from your authenticator app."
      } else if (error.status === 422 || errorMessage.includes("422")) {
        // 422 usually means invalid code, expired challenge, or wrong factor state
        // Check if we can get more details from the error response
        const errorDetails = (error as any).error_description || (error as any).hint || ""
        if (errorDetails) {
          errorMessage = `Invalid verification code: ${errorDetails}. Please ensure your device time is correct and try with a fresh code.`
        } else {
          errorMessage = "Invalid verification code. This could be due to:\n• Incorrect code from authenticator app\n• Device time not synchronized\n• Code expired (codes change every 30 seconds)\n\nPlease ensure your device time is correct and try with a fresh code."
        }
      } else if (errorMessage.includes("Unauthorized") || error.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      }
      
      // Create error object with original error details
      const enhancedError = new Error(errorMessage)
      ;(enhancedError as any).originalError = error
      ;(enhancedError as any).status = error.status
      ;(enhancedError as any).originalMessage = error.message
      
      return { data: null, error: enhancedError }
    }
    
    return { data, error }
  } catch (error: any) {
    // Return error with helpful message
    const errorMessage = error?.message || "An unexpected error occurred during verification"
    return { data: null, error: error instanceof Error ? error : new Error(errorMessage) }
  }
}

export async function listMFAFactors() {
  const supabase = createClient()
  
  try {
    // Ensure we have a valid session before making MFA calls
    await ensureSupabaseSession(supabase)
    
    const { data, error } = await supabase.auth.mfa.listFactors()
    return { data, error }
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function unenrollMFAFactor(factorId: string, verificationCode?: string) {
  const supabase = createClient()
  
  try {
    // Ensure we have a valid session before making MFA calls
    await ensureSupabaseSession(supabase)
    
    // If a verification code is provided, we need to create a challenge and verify first
    // This is required for unenrolling verified factors (AAL2 requirement)
    if (verificationCode) {
      // Step 1: Create a challenge for the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      })
      
      if (challengeError || !challengeData?.id) {
        return { 
          data: null, 
          error: new Error(challengeError?.message || "Failed to create verification challenge") 
        }
      }
      
      // Step 2: Verify the challenge with the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode.trim()
      })
      
      if (verifyError) {
        return { data: null, error: verifyError }
      }
      
      // Step 3: Now we can unenroll the factor (we have AAL2)
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId
      })
      
      return { data, error }
    } else {
      // Try direct unenroll (might work for unverified factors)
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId
      })
      
      // If we get AAL2 error, return a helpful error message
      if (error && error.message?.includes("AAL2")) {
        return { 
          data: null, 
          error: new Error("Verification code required to disable 2FA. Please provide your current authenticator code.") 
        }
      }
      
      return { data, error }
    }
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}