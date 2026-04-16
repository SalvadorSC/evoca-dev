# Improvements & DRY Opportunities

Documented patterns where code is duplicated or where abstraction would reduce maintenance burden. None of these have been applied yet — this is a reference for future refactoring.

---

## 1. Supabase client instantiation pattern

**Files:** every page/component that calls `createClient()` directly (e.g. `app/dashboard/page.tsx`, `app/present/[sessionId]/page.tsx`, `app/dashboard/talks/new/page.tsx`, `start-session-button.tsx`, `delete-talk-button.tsx`)

**Opportunity:** Create a typed `db` helper in `lib/db.ts` that wraps common queries (e.g. `getTalkBySlug`, `getSessionById`, `getUserTalks`) so query strings aren't repeated across files and schema changes only need to be updated in one place.

---

## 2. LocalStorage key constants

**Files:** `components/attendee/ask-tab.tsx`, `components/attendee/schedule-tab.tsx`, `components/shared/intro-modal.tsx`, `app/app/page.tsx`, `app/page.tsx`

**Opportunity:** Extract all `localStorage` key strings into a single `lib/storage-keys.ts` constants file (e.g. `STORAGE_KEYS.votedQuestions`, `STORAGE_KEYS.role`). Currently the keys are hardcoded string literals in multiple files, making them error-prone to typo and hard to rename.

---

## 3. `font-mono text-xs uppercase tracking-widest` label pattern

**Files:** `react-tab.tsx`, `ask-tab.tsx`, `present/[sessionId]/page.tsx`, `dashboard/page.tsx`, `dashboard/talks/[slug]/page.tsx`, `dashboard/talks/new/page.tsx`

**Opportunity:** Create a reusable `<Label>` component (or a `label` Tailwind variant) that encapsulates this exact combination. Currently copied verbatim in ~12 places.

---

## 4. Dark pill / backdrop panel pattern

**Files:** `present/[sessionId]/page.tsx` (branding pill, connection count, Q&A panel header), `dashboard/layout.tsx`, `components/shared/header.tsx`

**Opportunity:** A `<GlassPanel>` component with `background: rgba(0,0,0,0.75)`, `backdropFilter: blur(8px)`, `border: 1px solid #2a2a2a` would eliminate the repeated inline style objects across the present page overlay elements.

---

## 5. Question card rendering

**Files:** `present/[sessionId]/page.tsx` (Top Questions panel), `components/attendee/ask-tab.tsx` (question list)

**Opportunity:** Both render question cards with vote count, text, author name, and an action button. The structure is nearly identical. A shared `<QuestionCard>` component accepting `question`, `onAction`, `actionLabel`, `voted?` props would serve both contexts.

---

## 6. `useParty` room resolution logic

**Files:** `app/app/page.tsx` (reads `?room` from URL), `app/present/[sessionId]/page.tsx` (reads from DB session row)

**Opportunity:** Both resolve to a PartyKit room name via different mechanisms. Consider a `usePartyRoom(sessionId?)` hook that abstracts this so consuming components don't need to know where the room name comes from.

---

## 7. Dashboard RLS read-back pattern

**Files:** `app/dashboard/talks/new/page.tsx`, `start-session-button.tsx`

**Opportunity:** Both generate a local identifier (slug / partykit_room) before insert to avoid the RLS post-insert `.select()` silent empty bug. This pattern and its rationale should be documented in a `lib/README.md` so future contributors don't reintroduce the bug.

---

## 8. Auth guard pattern

**Files:** `app/dashboard/layout.tsx`, `app/dashboard/talks/new/page.tsx`, `start-session-button.tsx`, `delete-talk-button.tsx`

**Opportunity:** Each file independently calls `supabase.auth.getSession()` and redirects to `/login` on failure. A shared `requireAuth()` server-side helper or a `useRequireAuth()` client hook would centralise this logic.
