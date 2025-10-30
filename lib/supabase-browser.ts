// src/lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Use ANON_KEY for now; switch to PUBLISHABLE_KEY if you set it up
  )
}