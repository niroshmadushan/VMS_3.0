// src/lib/server-session.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getServerSession() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        get(name: string) {
          return cookies().get(name)?.value
        },
        set() {},  // No-op for server
        remove() {},  // No-op for server
      },
    }
  )

  const { data } = await supabase.auth.getSession()
  return data.session
}