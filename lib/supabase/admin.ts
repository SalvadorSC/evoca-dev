import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Bypasses RLS.
 * ONLY use in trusted server contexts (e.g. the Stripe webhook), never in
 * code reachable by a user request that hasn't been authorized.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error("Supabase URL is not set")
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
