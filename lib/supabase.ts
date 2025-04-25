import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

// Environment variables validation
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return key
}

// Singleton instance for client-side
let clientInstance: SupabaseClient<Database> | null = null

// Client-side singleton (for components)
export const createClientSupabaseClient = () => {
  if (clientInstance) return clientInstance

  clientInstance = createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'apikey': getSupabaseAnonKey(),
          'Authorization': `Bearer ${getSupabaseAnonKey()}`
        }
      }
    }
  )

  return clientInstance
}

// Server-side client (for API routes, Server Components)
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': getSupabaseServiceKey(),
          'Authorization': `Bearer ${getSupabaseServiceKey()}`
        }
      }
    }
  )
}

// Admin client (for admin operations)
export const createAdminSupabaseClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': getSupabaseServiceKey(),
          'Authorization': `Bearer ${getSupabaseServiceKey()}`
        }
      }
    }
  )
}

// Helper to ensure client-side only execution
export const getSupabase = () => {
  if (typeof window === 'undefined') {
    throw new Error('getSupabase can only be called client-side')
  }
  return createClientSupabaseClient()
}

