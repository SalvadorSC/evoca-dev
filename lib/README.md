# lib/ — Shared utilities

## RLS read-back pattern (improvement 7)

When inserting rows into tables protected by Row Level Security (RLS), **never
rely on `.select()` chained after `.insert()`**. Supabase RLS policies apply to
the *read* operation independently of the *write* operation, and a silent empty
result is returned instead of an error when the policy blocks the read-back.

**Bad:**
```ts
const { data } = await supabase
  .from("talks")
  .insert({ title, slug })
  .select("slug")
  .single()
// data may be null even if the insert succeeded
```

**Good — generate identifiers locally before the insert:**
```ts
const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`
const roomId = `evoca-${talkId.slice(0, 8)}-${Date.now().toString(36)}`

await supabase.from("talks").insert({ title, slug })

// Use the locally built values directly — no read-back needed
router.push(`/dashboard/talks/${slug}`)
```

This pattern is applied in:
- `app/dashboard/talks/new/page.tsx` (slug generation)
- `app/dashboard/talks/[slug]/start-session-button.tsx` (partykit_room generation)

## Module overview

| File | Purpose |
|------|---------|
| `db.ts` | Typed Supabase query helpers (getTalkBySlug, getSessionById, …) |
| `auth.ts` | `requireAuth()` and `getAuthUser()` server-side helpers |
| `storage-keys.ts` | Central registry of all `localStorage` key strings |
| `types.ts` | Shared TypeScript types (Question, Reaction, Session, …) |
| `sessions.ts` | Static JSConf schedule data |
| `utils.ts` | Tailwind cn() helper |
