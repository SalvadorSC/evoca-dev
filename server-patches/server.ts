import type * as Party from "partykit/server";
import { jwtVerify } from "jose";

// ============================================================
// CONFIGURATION
// ============================================================

// The Supabase JWT secret is read from PartyKit env (room.env.SUPABASE_JWT_SECRET).
// Set it with: npx partykit env add SUPABASE_JWT_SECRET
// At/above this many flags, a question becomes "flagged": hidden from attendees
// but still visible (dimmed) to moderators with delete/ban actions.
const FLAG_THRESHOLD = 3;

// Rate limits: [max messages, per N milliseconds]
const RATE_LIMITS: Record<string, [number, number]> = {
  reaction: [5, 3_000],
  question: [2, 30_000],
  vote: [10, 60_000],
  flag: [5, 60_000],
  attend: [10, 60_000],
};

// Command → minimum role required
const COMMAND_ROLES: Record<string, ConnectionRole> = {
  reaction: "attendee",
  question: "attendee",
  vote: "attendee",
  flag: "attendee",
  attend: "attendee",

  answer: "speaker",

  set_talk: "admin",
  set_mode: "admin",
  update_session: "admin",
  cancel_session: "admin",
  session_finished: "admin",
  push_alert: "admin",

  // Moderation (Phase 3)
  delete_question: "admin",
  ban_user: "admin",
  lift_ban: "admin",

  // Slide control + presenter passthrough (Phase 5) — broadcast-only, no state.
  // Speaker role required so attendees can't hijack the deck. The phone remote
  // connects with a speaker-scoped token, so its taps are authorized here.
  slide_next: "speaker",
  slide_prev: "speaker",
  slide_up: "speaker",
  slide_down: "speaker",
  highlight_question: "speaker",
};

// Commands that are simply rebroadcast to the room without mutating state.
const PASSTHROUGH_COMMANDS = new Set([
  "session_finished",
  "slide_next",
  "slide_prev",
  "slide_up",
  "slide_down",
  "highlight_question",
]);

// ============================================================
// TYPES
// ============================================================

type ConnectionRole = "attendee" | "speaker" | "admin";

const ROLE_HIERARCHY: Record<ConnectionRole, number> = {
  attendee: 0,
  speaker: 1,
  admin: 2,
};

interface Session {
  id: string;
  type: string;
  title: string;
  start: string;
  end: string;
  speaker: { name: string; role: string } | null;
  track: string;
  lang?: string;
  cancelled?: boolean;
}

interface Question {
  id: string;
  text: string;
  votes: number;
  answered: boolean;
  hidden?: boolean;
  flagged?: boolean;
  authorId?: string;
  createdAt: number;
  [key: string]: unknown;
}

interface State {
  reactions: object[];
  questions: Question[];
  talkTitle: string;
  mode: "wall" | "qa";
  flags: Record<string, number>;
  sessions: Session[];
  attendance: Record<
    string,
    {
      going: Array<{ userId: string; displayName: string }>;
      maybe: Array<{ userId: string; displayName: string }>;
    }
  >;
  alert: string | null;
}

interface ConnectionMeta {
  role: ConnectionRole;
  userId?: string;
}

// ============================================================
// PROFANITY FILTER (lightweight, zero-dependency placeholder)
// ============================================================

const BLOCKED_PATTERNS: RegExp[] = [];

function isOffensive(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, "");
  return BLOCKED_PATTERNS.some((p) => p.test(normalized));
}

// ============================================================
// RATE LIMITER
// ============================================================

class RateLimiter {
  private buckets: Map<string, number[]> = new Map();

  check(connectionId: string, action: string): boolean {
    const config = RATE_LIMITS[action];
    if (!config) return true;

    const [maxCount, windowMs] = config;
    const key = `${connectionId}:${action}`;
    const now = Date.now();

    let timestamps = this.buckets.get(key) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxCount) {
      this.buckets.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const maxWindow = 120_000;
    for (const [key, timestamps] of this.buckets) {
      const filtered = timestamps.filter((t) => now - t < maxWindow);
      if (filtered.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, filtered);
      }
    }
  }
}

// ============================================================
// JWT VERIFICATION (Supabase JWTs, verified with jose / HS256)
// ============================================================

interface JWTPayload {
  sub?: string;
  role?: string;
  user_metadata?: { role?: string; [key: string]: unknown };
  app_metadata?: { role?: string; [key: string]: unknown };
  exp?: number;
  [key: string]: unknown;
}

/**
 * Verify a Supabase JWT using the project's JWT secret (HS256, symmetric).
 * Signature + expiry are both enforced by jwtVerify. Returns null on any failure.
 *
 * NOTE: assumes the legacy symmetric (HS256) Supabase JWT secret. If the project
 * migrates to asymmetric signing keys (JWKS), swap jwtVerify's key for a remote
 * JWKS key set (createRemoteJWKSet) pointed at the project's /.well-known JWKS.
 */
async function verifyToken(
  token: string,
  jwtSecret: string | undefined
): Promise<JWTPayload | null> {
  if (!jwtSecret) {
    console.log("[server] SUPABASE_JWT_SECRET not set — rejecting token");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

function extractRole(payload: JWTPayload): ConnectionRole {
  const role =
    payload.app_metadata?.role ||
    payload.user_metadata?.role ||
    payload.role;

  if (role === "admin" || role === "organizer") return "admin";
  if (role === "speaker") return "speaker";
  return "attendee";
}

// ============================================================
// HELPERS
// ============================================================

function hasPermission(
  userRole: ConnectionRole,
  requiredRole: ConnectionRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

function getConnectionRole(conn: Party.Connection): ConnectionRole {
  return (conn.state as ConnectionMeta | undefined)?.role || "attendee";
}

/** Attendee view: hide both explicitly-hidden and flagged questions. */
function getVisibleState(state: State): State {
  return {
    ...state,
    questions: state.questions.filter((q) => !q.hidden && !q.flagged),
  };
}

/** Moderator view: include flagged (dimmed client-side); still drop hard-hidden. */
function getModeratorState(state: State): State {
  return {
    ...state,
    questions: state.questions.filter((q) => !q.hidden),
  };
}

// ============================================================
// SERVER
// ============================================================

export default class Server implements Party.Server {
  state: State = {
    reactions: [],
    questions: [],
    talkTitle: "JSConf España 2026",
    mode: "wall",
    flags: {},
    sessions: [],
    attendance: {},
    alert: null,
  };

  private rateLimiter = new RateLimiter();
  private voteTracker: Map<string, Set<string>> = new Map();
  // Server-only, in-memory, session-scoped ban list. Never broadcast to clients.
  private bannedAuthorIds: Set<string> = new Set();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {}

  onStart() {
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 120_000);
  }

  /**
   * Role-aware broadcast: attendees/speakers get the visible state (no flagged),
   * admins get the moderator state (flagged included, dimmed client-side).
   */
  private broadcastState() {
    const visible = JSON.stringify({ type: "sync", state: getVisibleState(this.state) });
    const moderator = JSON.stringify({ type: "sync", state: getModeratorState(this.state) });
    for (const conn of this.room.getConnections()) {
      conn.send(getConnectionRole(conn) === "admin" ? moderator : visible);
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");

    let role: ConnectionRole = "attendee";
    let userId: string | undefined;

    if (token) {
      const payload = await verifyToken(
        token,
        this.room.env.SUPABASE_JWT_SECRET as string | undefined
      );
      if (payload) {
        role = extractRole(payload);
        userId = payload.sub;
      }
    }

    conn.setState({ role, userId } satisfies ConnectionMeta);

    // Send the appropriate view for this connection's role, plus its role so the
    // client can gate moderator UI (server still enforces all actions).
    const state = role === "admin" ? getModeratorState(this.state) : getVisibleState(this.state);
    conn.send(JSON.stringify({ type: "sync", state, role }));

    this.broadcastConnectionCount();
  }

  onClose() {
    this.broadcastConnectionCount();
  }

  onMessage(raw: string, sender: Party.Connection) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const msgType = msg.type as string;
    if (!msgType) return;

    const requiredRole = COMMAND_ROLES[msgType];
    if (!requiredRole) {
      console.log(`[server] unknown command: ${msgType}`);
      return;
    }

    const senderRole = getConnectionRole(sender);
    if (!hasPermission(senderRole, requiredRole)) {
      sender.send(
        JSON.stringify({
          type: "error",
          code: "UNAUTHORIZED",
          message: `Insufficient permissions for '${msgType}'. Required: ${requiredRole}, you have: ${senderRole}`,
        })
      );
      console.log(`[server] BLOCKED: ${msgType} from ${senderRole} (needs ${requiredRole})`);
      return;
    }

    if (!this.rateLimiter.check(sender.id, msgType)) {
      sender.send(
        JSON.stringify({
          type: "error",
          code: "RATE_LIMITED",
          message: `Too many '${msgType}' actions. Please slow down.`,
        })
      );
      return;
    }

    // ---- HANDLE COMMANDS ----

    if (msgType === "session_finished") {
      this.room.broadcast(JSON.stringify(msg));
      return;
    }

    if (msgType === "reaction") {
      this.state.reactions = [msg, ...this.state.reactions].slice(0, 100);
    }

    if (msgType === "question") {
      const text = (msg.text as string) || "";
      const authorId = msg.authorId as string | undefined;

      // Enforce bans: silently drop questions from banned authors.
      if (authorId && this.bannedAuthorIds.has(authorId)) {
        console.log(`[server] BANNED: dropped question from author ${authorId}`);
        sender.send(
          JSON.stringify({
            type: "error",
            code: "BANNED",
            message: "You are not allowed to submit questions in this session.",
          })
        );
        return;
      }

      if (isOffensive(text)) {
        console.log(`[server] MODERATION: blocked question from ${sender.id}`);
        return;
      }

      const question: Question = {
        ...(msg as unknown as Question),
        hidden: false,
        flagged: false,
        authorId,
        createdAt: Date.now(),
      };
      this.state.questions = [question, ...this.state.questions].slice(0, 50);
    }

    if (msgType === "vote") {
      const questionId = msg.questionId as string;

      if (!this.voteTracker.has(questionId)) {
        this.voteTracker.set(questionId, new Set());
      }
      const voters = this.voteTracker.get(questionId)!;
      if (voters.has(sender.id)) {
        sender.send(
          JSON.stringify({
            type: "error",
            code: "DUPLICATE_VOTE",
            message: "You already voted on this question.",
          })
        );
        return;
      }
      voters.add(sender.id);

      this.state.questions = this.state.questions.map((q) =>
        q.id === questionId ? { ...q, votes: q.votes + 1 } : q
      );
    }

    if (msgType === "answer") {
      this.state.questions = this.state.questions.map((q) =>
        q.id === (msg.questionId as string) ? { ...q, answered: true } : q
      );
    }

    if (msgType === "flag") {
      const messageId = msg.messageId as string;
      this.state.flags[messageId] = (this.state.flags[messageId] || 0) + 1;

      // At threshold: mark flagged (hidden from attendees, dimmed for mods).
      if (this.state.flags[messageId] >= FLAG_THRESHOLD) {
        this.state.questions = this.state.questions.map((q) =>
          q.id === messageId ? { ...q, flagged: true } : q
        );
        console.log(`[server] FLAGGED: question ${messageId} reached ${FLAG_THRESHOLD} flags`);
      }
    }

    // ---- MODERATION (admin only; enforced above) ----

    if (msgType === "delete_question") {
      const questionId = msg.questionId as string;
      this.state.questions = this.state.questions.filter((q) => q.id !== questionId);
      this.voteTracker.delete(questionId);
      console.log(`[server] DELETE: question ${questionId} by ${sender.id}`);
    }

    if (msgType === "ban_user") {
      const authorId = msg.authorId as string | undefined;
      if (authorId) {
        this.bannedAuthorIds.add(authorId);
        // Remove the banned author's existing questions.
        this.state.questions = this.state.questions.filter((q) => q.authorId !== authorId);
        console.log(`[server] BAN: author ${authorId} by ${sender.id}`);
      }
    }

    if (msgType === "lift_ban") {
      const authorId = msg.authorId as string | undefined;
      if (authorId) {
        this.bannedAuthorIds.delete(authorId);
        console.log(`[server] LIFT BAN: author ${authorId} by ${sender.id}`);
      }
    }

    if (msgType === "set_talk") {
      this.state.talkTitle = msg.title as string;
    }

    if (msgType === "set_mode") {
      const mode = msg.mode as string;
      if (mode === "wall" || mode === "qa") {
        this.state.mode = mode;
      }
    }

    if (msgType === "update_session") {
      const session = msg.session as Session;
      this.state.sessions = this.state.sessions.map((s) =>
        s.id === session.id ? session : s
      );
    }

    if (msgType === "cancel_session") {
      this.state.sessions = this.state.sessions.map((s) =>
        s.id === (msg.sessionId as string) ? { ...s, cancelled: true } : s
      );
    }

    if (msgType === "attend") {
      const sessionId = msg.sessionId as string;
      const att = this.state.attendance[sessionId] || { going: [], maybe: [] };
      att.going = att.going.filter((u) => u.userId !== (msg.userId as string));
      att.maybe = att.maybe.filter((u) => u.userId !== (msg.userId as string));
      if (msg.status === "going") {
        att.going.push({
          userId: msg.userId as string,
          displayName: msg.displayName as string,
        });
      }
      if (msg.status === "maybe") {
        att.maybe.push({
          userId: msg.userId as string,
          displayName: msg.displayName as string,
        });
      }
      this.state.attendance[sessionId] = att;
    }

    if (msgType === "push_alert") {
      this.state.alert = msg.text as string;
      setTimeout(() => {
        this.state.alert = null;
        this.broadcastState();
      }, 30000);
    }

    this.broadcastState();
  }

  private broadcastConnectionCount() {
    this.room.broadcast(
      JSON.stringify({
        type: "connections",
        count: [...this.room.getConnections()].length,
      })
    );
  }
}

Server satisfies Party.Worker;
