/**
 * lib/auth.ts — Centralised auth helpers
 *
 * Each dashboard page/component previously called supabase.auth.getSession()
 * independently and redirected to /login on failure. This module provides a
 * single source of truth for that pattern.
 */

// ─── Server-side (RSC / Server Actions / Route Handlers) ─────────────────────

import { redirect } from "next/navigation"
import { createClient as createServerClient } from "@/lib/supabase/server"

/**
 * Requires an authenticated Supabase session on the server.
 * Redirects to /login if the user is not authenticated.
 * Returns the authenticated user object.
 */
export async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  return user
}

/**
 * Returns the authenticated user on the server, or null if unauthenticated.
 * Does NOT redirect — use this when you want to conditionally render
 * content rather than hard-redirect.
 */
export async function getAuthUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
