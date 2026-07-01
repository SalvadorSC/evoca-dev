import { createClient } from '@/lib/supabase/server'
import { linkAffiliationsOnSignup } from '@/lib/affiliations'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard/conference'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Link any speaker invitations addressed to this email (pending -> accepted).
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        try {
          await linkAffiliationsOnSignup(user.id, user.email)
        } catch (e) {
          console.log('[v0] affiliation link on signup failed:', e instanceof Error ? e.message : e)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
