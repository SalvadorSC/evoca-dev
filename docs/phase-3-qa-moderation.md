# Phase 3 — Q&A Moderation

> Status: **Code complete — blocked on server deploy** ⚠️
> Client code is merged in `evoca-dev`. The PartyKit server changes are written
> but require the user to (a) merge them into `SalvadorSC/evoca-server` and
> (b) set `SUPABASE_JWT_SECRET` + redeploy. See "Deployment" below.

---

## Goal

Give moderators better control over live Q&A sessions: flagged questions stay visible (dimmed to moderators) instead of disappearing, moderators can permanently delete questions, and repeat offenders can be session-banned.

---

## Features in this phase

| Feature | Status |
|---|---|
| Q&A — flagged questions visible-but-dimmed to moderators | Code complete |
| Q&A — question deletion by moderator | Code complete |
| Q&A — ban user on question removal | Code complete |

---

## ⚠️ Architecture reality (differs from the original draft below)

The original plan (sections 3.1–3.3) assumed Q&A lived in Supabase with REST
routes. **It does not.** Authoritative live Q&A state lives in a **separate
PartyKit server** (`SalvadorSC/evoca-server`, `src/server.ts`); this repo only
holds the client (`hooks/use-party.ts`). All moderation therefore flows through
**server state + realtime broadcast**, not REST/DB. No `session_bans` table, no
`/api/qna/*` routes were created.

### As built

**Server (`evoca-server` — changes staged in `server-patches/` of this repo):**
- Real `jose` JWT verification (HS256) using `room.env.SUPABASE_JWT_SECRET`.
- `authorId` on questions; in-memory, session-scoped ban set; bans enforced on submit.
- At the flag threshold (3) a question is marked `flagged` — **filtered out for
  attendees, included for admins** via role-aware broadcast.
- New admin-only commands: `delete_question`, `ban_user`, `lift_ban`.
- `sync` payload now carries the connection `role`.

**Client (this repo):**
- `lib/anon-id.ts` — stable per-browser author id (reuses the attendee token key).
- `hooks/use-party.ts` — sends the Supabase access token as `?token=`; exposes
  `userRole` / `isModerator` from the server's sync payload.
- `components/attendee/ask-tab.tsx` — attaches `authorId` to submitted questions.
- `app/qna/[sessionId]/page.tsx` — moderator view: flagged questions dimmed with
  a red "Flagged — hidden from attendees" badge and sorted last; Delete + Ban
  actions per question, gated by `isModerator` (server still enforces).
- `lib/types.ts` — `flagged`/`authorId` on `Question`, `UserRole`, moderation
  `ClientMessage`s, `role` on the sync `ServerMessage`, and an `error` message.

### Decisions (locked with the user)
1. Real JWT auth via `jose` (not the insecure base64 stub).
2. Bans key off a stable anon id (+ Supabase user id when signed in).
3. Flagged = hidden from attendees, dimmed for moderators.
4. Bans/deletes live in PartyKit in-memory state (no DB schema changes).

---

## Deployment (required to go live)

1. Apply `server-patches/server.ts` (or `server-patches/qa-moderation.patch`) to
   `SalvadorSC/evoca-server` — see `server-patches/README.md`.
2. `npm install jose` in that repo.
3. `npx partykit env add SUPABASE_JWT_SECRET` (value from Supabase → Project
   Settings → API → JWT Secret). **Caveat:** assumes the legacy HS256 secret; if
   the project uses asymmetric/JWKS keys, switch `verifyToken` to a remote JWKS.
4. `npx partykit deploy`.

---

## Current state (before this phase)

Flagging a question hard-hides it from everyone at 3 flags. There is no deletion option. There is no ban mechanism. The client connects to PartyKit with no auth, so everyone is treated as an attendee.

---

## 3.1 Flagged Questions — Dimmed & Visible
Files: `app/session/[sessionId].tsx` (Q&A section), `components/qna/QuestionCard.tsx`

### Behaviour change
- **Before:** flagged question disappears from moderator view
- **After:** flagged question stays in the list, rendered at reduced opacity (~40%), pushed to the bottom of the list

### Visual treatment
- `opacity-40` + `italic` text on the question body
- Small "Flagged" badge on the card
- Still shows vote count, author, timestamp
- Still shows moderator actions (delete, ban)

### Sorting rule
`unflagged questions (sorted by votes) → flagged questions (sorted by flagged_at)`

---

## 3.2 Permanent Deletion by Moderator
Files: `components/qna/QuestionCard.tsx`, `app/api/qna/delete/route.ts`

### UI
- Trash icon visible only in moderator view (existing moderator role check)
- Clicking trash → opens a confirmation dialog:
  > "Delete this question? This cannot be undone."
  > [Cancel] [Delete]

### API
- `DELETE /api/qna/delete` — auth-protected, moderator only
- Removes row from `questions` table
- Broadcasts deletion event via existing realtime channel so all connected clients remove it instantly

---

## 3.3 User Ban on Question Removal
Files: `components/qna/BanConfirmDialog.tsx`, `app/api/qna/ban/route.ts`

### When it triggers
- After permanent deletion (step 3.2), moderator sees a secondary prompt:
  > "Also prevent this user from submitting more questions in this session?"
  > [No, just delete] [Yes, ban from session]

### Ban mechanics
- Ban is **session-scoped** — only affects the current session, not the user's account
- Ban is **reversible** — moderator sees a "Banned users" list in the moderation panel and can lift bans
- Banned users who try to submit a question see: "You have been removed from this Q&A session."

### Data model
```sql
-- Add to existing session/qna structure
CREATE TABLE session_bans (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  user_id      uuid references speakers(user_id),
  anonymous_id text,   -- for unauthenticated users (fingerprint or cookie)
  banned_by    uuid not null references speakers(user_id),
  banned_at    timestamptz not null default now(),
  lifted_at    timestamptz,
  unique(session_id, user_id),
  unique(session_id, anonymous_id)
);
```

### Moderator "Banned users" panel
- Small collapsible section in the moderator sidebar
- Lists currently banned users (display name or "Anonymous")
- "Lift ban" button next to each

---

## Definition of Done

Code-complete (typechecked); realtime behaviour pending server deploy.

- [x] Flagged questions render dimmed at the bottom of the moderator list (not hidden from mods)
- [x] Unflagged questions sort by votes, flagged sort after
- [x] Flagged questions filtered out for attendees (server role-aware broadcast)
- [x] Delete action visible in moderator view, with confirmation
- [x] Delete removes the question from server state and broadcasts to all clients
- [x] Ban action with confirmation; bans key off `authorId`
- [x] Banned users' submissions are rejected server-side (in-memory, session-scoped)
- [x] `lift_ban` command implemented server-side
- [x] `features.json` feat-016, feat-017, feat-018 marked complete
- [ ] **Verified end-to-end in browser** — blocked until the server is deployed with `SUPABASE_JWT_SECRET`
- [ ] *(deferred)* Moderator-facing "Banned users" list + lift-ban UI (server supports it; no UI yet)
- [ ] *(deferred)* Attendee-facing "you've been removed" toast on the ask tab
