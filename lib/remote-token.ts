import "server-only"
import { SignJWT, jwtVerify } from "jose"

/**
 * Remote-control tokens (Phase 5.2).
 *
 * A presenter (already authenticated) mints a short-lived token that is encoded
 * into the phone-remote URL / QR code. The phone opens that URL with no login —
 * the token *is* the credential.
 *
 * The token is a standard HS256 JWT signed with SUPABASE_JWT_SECRET and carries
 * `role: "speaker"`, so the existing PartyKit server verifies it with the same
 * secret and grants speaker privileges (enough to send slide commands) WITHOUT
 * any special-casing on the server. Scope is pinned to a single session + room
 * and it expires after 8 hours.
 */

const REMOTE_TOKEN_TTL_SECONDS = 8 * 60 * 60 // 8 hours

export interface RemoteTokenClaims {
  sub: string // speaker user id
  role: "speaker"
  scope: "remote"
  sessionId: string
  room: string
}

function getSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set")
  return new TextEncoder().encode(secret)
}

/** Mint a signed 8-hour remote-control token scoped to one session/room. */
export async function mintRemoteToken(opts: {
  userId: string
  sessionId: string
  room: string
}): Promise<string> {
  return new SignJWT({
    role: "speaker",
    scope: "remote",
    sessionId: opts.sessionId,
    room: opts.room,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(opts.userId)
    .setIssuedAt()
    .setExpirationTime(`${REMOTE_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

/**
 * Verify a remote token. Signature + expiry are enforced by jwtVerify.
 * Returns the scoped claims, or null on any failure (bad sig, expired, wrong
 * scope/role).
 */
export async function verifyRemoteToken(token: string): Promise<RemoteTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.scope !== "remote" || payload.role !== "speaker") return null
    if (typeof payload.sub !== "string") return null
    if (typeof payload.sessionId !== "string" || typeof payload.room !== "string") return null
    return {
      sub: payload.sub,
      role: "speaker",
      scope: "remote",
      sessionId: payload.sessionId,
      room: payload.room,
    }
  } catch {
    return null
  }
}
