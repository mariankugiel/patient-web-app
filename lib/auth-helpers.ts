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
