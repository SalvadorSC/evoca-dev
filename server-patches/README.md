# evoca-server — Q&A Moderation changes (Phase 3)

These files hold the PartyKit server changes for Phase 3 Q&A moderation. They
live here **only because v0 could not push to `SalvadorSC/evoca-server`** (the
GitHub integration in this chat is authorized for `evoca-dev`, not the server
repo). Apply them to the server repo to go live.

## Contents

- `server.ts` — the full updated `src/server.ts` (drop-in replacement).
- `qa-moderation.patch` — a `git format-patch` of the same change, in case you
  prefer applying a diff on top of the current `src/server.ts`.

## What changed

- Real JWT verification with `jose` (HS256) using `room.env.SUPABASE_JWT_SECRET`.
- `authorId` added to questions; in-memory, session-scoped ban enforcement on submit.
- Flag threshold (3) now marks a question `flagged` — **hidden from attendees,
  shown dimmed to moderators** — instead of hard-hiding it from everyone.
- Role-aware broadcast (admins receive flagged questions; attendees do not).
- New admin-only commands: `delete_question`, `ban_user`, `lift_ban`.
- The `sync` payload now includes the connection's `role` so the client can gate
  moderator UI (the server still enforces every action).

## How to apply

Option A — replace the file:
1. Copy `server.ts` over `src/server.ts` in the `evoca-server` repo.
2. `npm install jose`
3. Commit + push.

Option B — apply the patch:
1. From the `evoca-server` repo root: `git am < qa-moderation.patch`
   (or `git apply qa-moderation.patch` to apply without committing).
2. `npm install jose`

## Required before it works

1. Set the JWT secret in PartyKit env:
   `npx partykit env add SUPABASE_JWT_SECRET`
   (value = your Supabase project's JWT secret — Supabase Dashboard →
   Project Settings → API → JWT Settings → "JWT Secret").
2. Deploy: `npx partykit deploy`

## Caveat — JWT signing algorithm

This assumes the **legacy symmetric (HS256)** Supabase JWT secret. If your
project has migrated to **asymmetric signing keys (JWKS)**, swap `jwtVerify`'s
key for `createRemoteJWKSet(new URL(<project>/auth/v1/.well-known/jwks.json))`.
Confirm which one your project uses before deploying.
