# Evoca — Testing Guide

A practical, step-by-step introduction for testing the Evoca platform. Read this
first, then work through the companion spreadsheet **`evoca-test-plan.xlsx`** to
record results as you go.

---

## 1. What is Evoca?

Evoca is a conference & talk platform with two main personas on one account:

- **Speaker** — creates talks, uploads/embeds slides, presents, runs live Q&A,
  uses a phone remote.
- **Organizer** — creates conferences, builds the schedule, invites speakers,
  runs a Call for Papers (CFP), and publishes a public conference page with
  live streams.

Access to "live" features is controlled by **billing state** (Free / Prep /
Live), so a big part of testing is verifying the right things unlock or lock for
each plan.

---

## 2. Before you start

### 2.1 Environment
- Use the **preview / development** deployment. Dev-only login shortcuts are
  disabled in production (they return 404).
- Have a desktop browser plus a phone (or a second browser window) ready — some
  flows (phone remote, attendee Q&A, live wall) are multi-device.

### 2.2 Test accounts
Every billing/role state is pre-seeded. Don't create real accounts — use these.

| Sign in as | Email | Use it to test |
|---|---|---|
| `free` | test.free@evoca.test | Free limits + paywall |
| `speaker-pro` | test.speakerpro@evoca.test | Speaker Pro features |
| `organizer-live` | test.orglive@evoca.test | Full organizer (LIVE) |
| `organizer-onetime-live` | test.onetime.live@evoca.test | One-time, inside event window (LIVE) |
| `organizer-onetime-prep` | test.onetime.prep@evoca.test | One-time, before window (PREP only) |
| `organizer-expired` | test.expired@evoca.test | Cancelled → locked (NONE) |
| `organizer-grace` | test.grace@evoca.test | Payment failed → grace (PREP) |
| `both` | test.both@evoca.test | Speaker Pro + organizer |
| `affiliated-speaker` | test.affiliated@evoca.test | Event-scoped Pro via invite |

**How to log in (dev only):**
1. Go to `/login` and use the **"Dev only"** panel — click an account to sign in.
2. Or hit `GET /api/dev-login?as=<key>` directly (e.g. `/api/dev-login?as=organizer-live`).

> There is also a manual QA account: **ssc2324@proton.me**, which owns "Test
> Conference 2026" (published, with a stream and schedule) and a talk "Building
> Realtime Apps". Use it for free-form exploration.

### 2.3 Access-state cheat sheet
- **LIVE** — present, reactions, Q&A, full conference management.
- **PREP** — set up conferences/schedule only; no live/presenting.
- **NONE** — gated actions open the paywall; content stays visible.

---

## 3. How to use the test plan spreadsheet

Open `docs/evoca-test-plan.xlsx`. It has three sheets:

1. **Instructions** — a short recap + the status legend.
2. **Test Plan** — one row per test case. Fill in these columns as you test:
   - **Status** — pick from the dropdown: `Not Started`, `Pass`, `Fail`,
     `Blocked`, `N/A`.
   - **Actual Result** — what actually happened (especially on Fail).
   - **Tester** / **Date** — who ran it and when.
3. **Summary** — auto-counts each status so you can see overall progress.

Work top-to-bottom within an area. Each row lists the **Test Account** to use and
the **Route** to visit.

---

## 4. Suggested testing order

The areas build on each other, so this order minimizes setup churn:

1. **Auth & Access** — log in as each account; confirm the access state matches
   the table above.
2. **Billing & Paywall** — pricing page, currency, checkout, plan management,
   gated actions opening the paywall.
3. **Conference Management** — create/edit conference, days, slots, tracks.
4. **Call for Papers** — public submission, organizer review, accept → slot.
5. **Talks & Slides** — create a talk, embed a URL, upload a PDF/PPTX.
6. **Presentation & Remote** — present a session, phone remote, slide control.
7. **Live Q&A & Wall** — attendee questions, moderation, live wall, reactions.
8. **Public Conference Page & Streams** (newest) — add per-track streams,
   feature one, publish, view `/c/<slug>`, switch tracks.
9. **Responsive & Accessibility** — mobile layouts, keyboard nav, contrast.

---

## 5. Area-by-area walkthroughs

### 5.1 Auth & Access
1. From `/login`, sign in as `free`. Confirm you land on `/dashboard`.
2. Repeat for each account; for each, confirm gated actions behave per the
   access state (LIVE/PREP/NONE).
3. Sign out and confirm protected routes redirect to login.

### 5.2 Billing & Paywall
1. Visit `/` and `/pricing`; confirm plans and prices render.
2. Currency: a EU IP shows EUR; outside EU shows USD (see `/api/locale`).
3. As `free`, try to create a conference → the paywall modal should appear.
4. As `organizer-live`, the same action proceeds.
5. `/dashboard/account` → manage plan (Stripe portal/checkout in test mode).

### 5.3 Conference Management
1. As `organizer-live`, go to `/dashboard/conference` → open or create one.
2. Add a **day**, then **slots** (keynote/talk/break), set times, durations,
   and **track** names.
3. Rename the conference and a day; confirm inline edit + save works.
4. Assign a speaker to a slot by email.

### 5.4 Call for Papers
1. Organizer: `/dashboard/conference/[id]/cfp` → enable CFP, add custom questions.
2. Public: open `/cfp/[slug]` in a logged-out window, submit a proposal.
3. Organizer: `/dashboard/conference/[id]/cfp/review` → rate, then accept one →
   confirm it creates an unscheduled slot + a pending affiliation.

### 5.5 Talks & Slides
1. As a speaker, `/dashboard/talks/new`:
   - Step through the wizard; on the slides step try **(a)** pasting an embed URL
     and **(b)** uploading a PDF/PPTX.
   - Confirm the **slide preview** (thumbnail grid for files, iframe for URLs)
     shows on the confirmation step.
2. Save and confirm the talk appears on `/dashboard`.

### 5.6 Presentation & Phone Remote
1. Open a session at `/present/[sessionId]`; confirm slides render.
2. Click the **phone remote** QR; scan it (or open `/remote/[token]`).
3. From the phone, advance/Go-back slides; confirm the presenter view updates.

### 5.7 Live Q&A & Wall
1. Attendee: `/qna/[sessionId]` (or the `/app` Ask tab) → submit questions, react.
2. Presenter/mod: `/present/[sessionId]` → flag, delete, ban; confirm changes
   propagate live.
3. `/wall` → confirm questions/reactions appear on the big screen.

### 5.8 Public Conference Page & Live Streams (newest feature)
1. Organizer: open a conference → **Live streams** section. Paste a Dailymotion
   URL or ID for a track, add a label, and mark one **Featured**.
2. Use the **Publish** toggle; confirm a `/c/<slug>` link appears and is copyable.
3. Open `/c/<slug>` (logged out): confirm the featured stream plays, the **track
   switcher** swaps streams, and the **schedule** renders read-only.
4. Negative: an **unpublished** conference's slug should **404**.

### 5.9 Responsive & Accessibility
1. Test key pages at mobile width (~375px) and desktop.
2. Keyboard-only: tab through forms, dialogs, and the schedule.
3. Confirm action buttons show a pointer cursor + hover state, and text on
   colored buttons has sufficient contrast in both light and dark themes.

---

## 6. Logging a bug

When something fails, capture in the spreadsheet's **Actual Result** / **Notes**:
- The **account** and **route** used.
- **Steps** to reproduce.
- **Expected** vs **actual**.
- A screenshot link and any console error (`[v0] ...` logs help).

---

## 7. Known limitations (don't file these as bugs)
- **Dailymotion**: embed-only for now — there is no in-app stream creation
  (Partner API is a future phase). A pasted/placeholder video may not actually
  play; that's expected.
- **Speaker Pro**: stubbed in the catalog, not yet surfaced as a purchasable plan.
- **Invitation/CFP emails**: only send when `RESEND_API_KEY` is configured;
  otherwise the DB rows are still created.
- **Phase 6 (Polish & Responsive)**: not finished, so minor visual rough edges
  may exist.
