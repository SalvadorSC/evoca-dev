# Phase 3 — Q&A Moderation

> Status: **Pending**
> Blocker: None. Can ship independently of other phases.

---

## Goal

Give moderators better control over live Q&A sessions: flagged questions stay visible (dimmed) instead of disappearing, moderators can permanently delete questions, and repeat offenders can be session-banned.

---

## Features in this phase

| Feature | Status |
|---|---|
| Q&A — flagged questions remain visible (dimmed) | Pending |
| Q&A — question deletion by moderator | Pending |
| Q&A — ban user on question removal | Pending |

---

## Current state (before this phase)

Flagging a question hides it entirely from the moderator's view. There is no deletion option. There is no ban mechanism.

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

- [ ] Flagged questions render dimmed at the bottom of the list (not hidden)
- [ ] Unflagged questions sort by votes, flagged sort after
- [ ] Trash icon visible in moderator view on all questions
- [ ] Deletion confirmation dialog works and removes question from all clients in realtime
- [ ] Post-deletion ban prompt appears
- [ ] Banned users cannot submit questions in that session
- [ ] Moderator can see and lift bans from the moderation panel
- [ ] `features.json` feat-016, feat-017, feat-018 marked complete
