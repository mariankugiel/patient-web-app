import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid creating multiple clients
let supabaseInstance: SupabaseClient | null = null
let supabaseAnonKey: string | null = null

export const createClient = () => {
  // Get environment variables - check both NEXT_PUBLIC_ and non-prefixed versions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  
  // Validate environment variables only when createClient is called
  if (!supabaseUrl || !currentAnonKey) {
    const errorMessage = 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file'
    
    // Provide helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('❌', errorMessage)
      console.error('📝 Create a .env.local file in the patient-web-app directory with:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
    }
    
    throw new Error(errorMessage)
  }
  
  // Recreate client if API key changed or instance doesn't exist
  if (!supabaseInstance || supabaseAnonKey !== currentAnonKey) {
    supabaseAnonKey = currentAnonKey
    
    // Create the singleton instance
    // The Supabase client automatically adds the apikey header to all requests
    supabaseInstance = createSupabaseClient(supabaseUrl, currentAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'apikey': currentAnonKey,
        },
      },
    })
  }
  
  return supabaseInstance
}
