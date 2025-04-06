import { createClient } from "@supabase/supabase-js"

// For server components
export const createServerSupabaseClient = () => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

// For client components (singleton pattern)
let clientSupabaseClient: any = null

export const createClientSupabaseClient = () => {
  if (clientSupabaseClient) return clientSupabaseClient

  clientSupabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return clientSupabaseClient
}

