export interface Reaction {
  type: "reaction"
  id: string
  name: string
  text: string
  emoji: string
  ts: number
  flags: number
}

export interface Question {
  type: "question"
  id: string
  name: string
  text: string
  votes: number
  answered: boolean
  ts: number
  /** Stable id of the author (Supabase user id, else persistent anon id). */
  authorId?: string
  /**
   * True once the question crosses the flag threshold. Attendees never receive
   * flagged questions; moderators receive them and render them dimmed.
   */
  flagged?: boolean
}

/** Connection role as reported by the realtime server in the sync payload. */
export type UserRole = "attendee" | "speaker" | "admin"

export interface Speaker {
  name: string
  role: string
}

export interface Session {
  id: string
  type: "talk" | "lightning" | "workshop" | "break"
  title: string
  start: string
  end: string
  speaker: Speaker | null
  track: "main" | "workshop"
  lang?: string
  cancelled?: boolean
}

export interface AttendeeInfo {
  userId: string
  displayName: string
}

export interface SessionAttendance {
  going: AttendeeInfo[]
  maybe: AttendeeInfo[]
}

export type AttendanceRecord = Record<string, SessionAttendance>

// Legacy flat format (kept for backwards compatibility)
export interface Attendance {
  sessionId: string
  status: "going" | "maybe" | "skip"
  userId: string
  displayName: string
}

export interface AppState {
  reactions: Reaction[]
  questions: Question[]
  currentTalk: string
  mode: "wall" | "qa"
  alert: { text: string; expiresAt: number } | null
  sessions: Session[]
  attendance: AttendanceRecord
}

export type ClientMessage =
  | { type: "reaction"; id: string; name: string; text: string; emoji: string; ts: number }
  | { type: "question"; id: string; name: string; text: string; votes: number; answered: boolean; ts: number; authorId?: string }
  | { type: "vote"; questionId: string }
  | { type: "delete_question"; questionId: string }
  | { type: "ban_user"; authorId: string }
  | { type: "lift_ban"; authorId: string }
  | { type: "set_talk"; title: string }
  | { type: "set_mode"; mode: "wall" | "qa" }
  | { type: "flag"; messageId: string }
  | { type: "push_alert"; text: string }
  | { type: "answer"; questionId: string }
  | { type: "attend"; sessionId: string; status: "going" | "maybe" | "skip"; userId: string; displayName: string }
  | { type: "update_session"; session: Session }
  | { type: "cancel_session"; sessionId: string }
  | { type: "wipe" }
  | { type: "slide_next" }
  | { type: "slide_prev" }
  | { type: "highlight_question"; questionId: string }
  | { type: "session_finished"; sessionId: string }

export type ServerMessage =
  | { type: "sync"; state: AppState; role?: UserRole }
  | { type: "connections"; count: number }
  | { type: "error"; code: string; message: string }
  | { type: "slide_next" }
  | { type: "slide_prev" }
  | { type: "highlight_question"; questionId: string }
  | { type: "session_finished"; sessionId: string }
