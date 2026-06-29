import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Dev-only login bypass. Generates a magic-link token for a test account and
// routes it through /auth/confirm (server-side verifyOtp) so cookies are set
// reliably. NEVER reachable in production.
//
// Usage: /api/dev-login?as=<key>  (defaults to the owner account)
// Keys are documented in docs/test-accounts.md and seeded by
// scripts/seed-test-accounts.mjs.

const TEST_ACCOUNTS: Record<string, string> = {
  owner: "sanchezcampossalvador@gmail.com",
  free: "test.free@evoca.test",
  "speaker-pro": "test.speakerpro@evoca.test",
  "organizer-live": "test.orglive@evoca.test",
  "organizer-onetime-live": "test.onetime.live@evoca.test",
  "organizer-onetime-prep": "test.onetime.prep@evoca.test",
  "organizer-onetime-unset": "test.onetime.unset@evoca.test",
  "organizer-expired": "test.expired@evoca.test",
  "organizer-grace": "test.grace@evoca.test",
  both: "test.both@evoca.test",
  "affiliated-speaker": "test.affiliated@evoca.test",
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const key = request.nextUrl.searchParams.get("as") ?? "owner"
  const email = TEST_ACCOUNTS[key]
  if (!email) {
    return NextResponse.json(
      { error: `Unknown test account "${key}". Known: ${Object.keys(TEST_ACCOUNTS).join(", ")}` },
      { status: 400 },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to generate link" },
      { status: 500 },
    )
  }

  const origin = request.nextUrl.origin
  const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
    tokenHash,
  )}&type=magiclink&next=/dashboard`
  return NextResponse.redirect(confirmUrl)
}
