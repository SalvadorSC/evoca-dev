import { createClient } from "@/lib/supabase/server"
import { linkAffiliationsOnSignup } from "@/lib/affiliations"
import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Server-side OTP / magic-link confirmation.
 * Consumes a `token_hash` (from Supabase generateLink or an email link) via
 * verifyOtp, which sets the session cookies on the SSR client. This avoids the
 * implicit hash-fragment flow that a Route Handler cannot read.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const token_hash = searchParams.get("token_hash")
  const type = (searchParams.get("type") ?? "email") as EmailOtpType
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      // Link any pending speaker invitations addressed to this email.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        try {
          await linkAffiliationsOnSignup(user.id, user.email)
        } catch (e) {
          console.log("[v0] affiliation link on confirm failed:", e instanceof Error ? e.message : e)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.log("[v0] verifyOtp failed:", error.message)
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
