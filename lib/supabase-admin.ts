// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // same as anon
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // service key (⚠️ server-side only)
)
