import { NextResponse } from "next/server"
import { verifyRemoteToken } from "@/lib/remote-token"

export const dynamic = "force-dynamic"

/**
 * GET /api/remote/validate?token=...
 *
 * Public endpoint used by the phone-remote page on load. Returns the room to
 * connect to if the token is valid (signature + expiry + scope), else 401.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 })
  }

  const claims = await verifyRemoteToken(token)
  if (!claims) {
    return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 401 })
  }

  return NextResponse.json({ ok: true, sessionId: claims.sessionId, room: claims.room })
}
