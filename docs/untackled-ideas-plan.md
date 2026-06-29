# Plan — Untackled Ideas

Scope: the ideas in `ideas.json` that are **not yet built**. As of this plan:

| Idea | Status |
| --- | --- |
| idea-001 — Dailymotion live streaming | not started (this plan) |
| idea-002 — CFP talk submission | **already built** (submission form + organizer review/accept/reject in dashboard) |
| idea-003 — Draw-on-presentation annotations | not started (this plan) |

So this plan covers **idea-001** and **idea-003** only.

## Architecture recap (so the plan stays grounded)

- **Next app** (`evoca-dev`, this repo): client + Supabase (auth, conferences, talks, sessions).
- **PartyKit server** (`SalvadorSC/evoca-server`): authoritative *live* room state
  (questions, reactions, presenter cursor), consumed via `hooks/use-party.ts` + `partysocket`.
- Live "stage" screens (`/wall`, `/present`, `/speaker`, `/remote`, `/qna`, `/app`) are
  `.force-dark` and driven by broadcast state.

Anything real-time must flow through the PartyKit server + broadcast, **not** REST.

---

## Idea-001 — Dailymotion live streaming

**Goal:** organizers stream their event live via Dailymotion and embed the player on the
public conference page. Viewers need no Dailymotion login; organizer auth is server-side.

### Open questions to confirm with user before building
1. **Embed-only vs. API-managed stream?**
   - *Embed-only (recommended first step):* organizer pastes a Dailymotion video/live URL or
     ID into conference settings; we embed the player. No Dailymotion OAuth, no API keys.
   - *API-managed:* we create/manage the live stream via the Dailymotion API (needs partner
     API credentials + OAuth) — much heavier; only if the user wants in-app stream control.
2. Where should the player appear — public conference page, the live `/wall`, or both?
3. Should the stream replace or sit alongside the existing live wall content?

### Phase A — Embed-only (assume this unless told otherwise)
1. **Schema:** add `livestream_url` (text, nullable) to the `conferences` table
   (Supabase migration). Optionally `livestream_provider` for future providers.
2. **Organizer settings UI:** field in `app/dashboard/conference/[id]` to set/clear the
   stream URL. Validate + normalize to a Dailymotion video ID.
3. **`components/shared/dailymotion-player.tsx`:** responsive 16:9 iframe
   (`https://www.dailymotion.com/embed/video/<id>`), `title`, `allowfullscreen`,
   lazy-loaded, with a graceful empty state when no stream is set.
4. **Public conference page:** render the player when `livestream_url` is set.
5. **A11y/perf:** `loading="lazy"`, accessible title, no layout shift (reserve aspect ratio).

### Phase B — API-managed (only if requested)
- Dailymotion Partner API: server-side OAuth (client credentials), env vars
  `DAILYMOTION_API_KEY` / `DAILYMOTION_API_SECRET` (prompt user to add).
- Create/start/stop live stream from the dashboard; persist returned stream ID.
- Route handlers (server-only) to proxy authenticated calls. Never expose secrets client-side.

### Verification
- Organizer sets a URL → player appears on the public page for an anon viewer.
- Invalid/empty URL → clean empty state, no broken iframe.
- Mobile: player scales 16:9 with no overflow.

### Risks
- Dailymotion embed domain/CSP: ensure `frame-src`/`frame-ancestors` allow the embed.
- API-managed path is a hard dependency on partner credentials — confirm the user has them.

---

## Idea-003 — Draw-on-presentation annotations

**Goal:** speaker (and possibly remote viewers) draw freehand annotations over the live
slide, like a whiteboard overlay, triggerable from a phone.

**Priority:** low. **Needs UX scoping before implementation** (per the idea note).

### Open questions to confirm with user
1. **Who can draw?** Presenter only (simplest), or remote viewers too (multi-user, conflict
   handling, moderation)?
2. **Persistence?** Ephemeral (clear on slide change) or saved per slide?
3. **Surface:** overlay on `/present` (projector) and/or the phone `/remote` control?

### Proposed approach (presenter-only, ephemeral — recommended MVP)
1. **Server (`evoca-server`):** add `annotations` to room state as an array of strokes
   (`{ id, points: [{x,y}], color, width, authorId }`). New commands: `add_stroke`,
   `clear_strokes` (role-gated to presenter/admin via existing `COMMAND_ROLES`). Broadcast
   on change via the existing `broadcastState()`. Clear strokes on `slide_change`.
   - Two-repo change: requires a separate `evoca-server` deploy (PartyKit credentials).
2. **Client overlay (`components/shared/annotation-canvas.tsx`):** absolutely-positioned
   `<canvas>` over the slide. Capture pointer events, normalize coords to 0..1 (resolution-
   independent), send `add_stroke`. Render all strokes from room state.
3. **Phone trigger (`/remote`):** a "draw" toggle + color/width picker; pointer drawing
   maps to normalized coords and emits the same `add_stroke` command.
4. **Presenter view (`/present`):** render the canvas overlay read+write; "Clear" button
   emits `clear_strokes`.
5. **Types:** add `Stroke`/`annotations` to `lib/types.ts` and the client message types.

### Verification
- Draw on phone → stroke appears on `/present` and `/wall` in real time.
- Slide change clears annotations.
- A non-presenter `add_stroke` is rejected by server role enforcement.

### Risks
- Real-time stroke volume: throttle/batch points (e.g. send on pointer-move at ~30–60ms,
  or send completed strokes) to avoid flooding the room.
- Multi-user drawing (if requested) adds conflict + moderation scope — keep MVP presenter-only.
- Server deploy dependency (same as Phase 3 Q&A work): cannot deploy without PartyKit creds.

---

## Suggested sequencing

1. **Idea-001 Phase A (Dailymotion embed-only)** — highest value, lowest risk, no server deploy.
2. **Idea-003 MVP (presenter-only annotations)** — needs UX sign-off + a server deploy.
3. **Idea-001 Phase B / Idea-003 multi-user** — only if explicitly prioritized later.
