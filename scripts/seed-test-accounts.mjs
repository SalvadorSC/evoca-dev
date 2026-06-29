// ─────────────────────────────────────────────────────────────────────────────
// Seed test accounts covering every billing / role case.
// Idempotent: re-running updates existing accounts rather than duplicating them.
//
// Run with:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-test-accounts.mjs
//
// See docs/test-accounts.md for the catalogue of accounts and how to log in.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const iso = (ms) => new Date(ms).toISOString()

// ─── Account catalogue ──────────────────────────────────────────────────────
// `key` is used as the ?as= param for /api/dev-login.
const ACCOUNTS = [
  {
    key: "free",
    email: "test.free@evoca.test",
    name: "Free Frankie",
    speaker_plan: "free",
    note: "Free speaker, no paid access. Baseline / paywall trigger.",
  },
  {
    key: "speaker-pro",
    email: "test.speakerpro@evoca.test",
    name: "Pro Petra",
    speaker_plan: "speaker_pro_monthly",
    note: "Speaker with their own Pro subscription (speaker features unlocked).",
  },
  {
    key: "organizer-live",
    email: "test.orglive@evoca.test",
    name: "Organizer Olivia",
    speaker_plan: "free",
    sub: { plan: "organizer_monthly", status: "active" },
    note: "Active monthly subscription => full LIVE organizer access (unlimited).",
    seedConference: true, // owns the conference the affiliated speaker is invited to
  },
  {
    key: "organizer-onetime-live",
    email: "test.onetime.live@evoca.test",
    name: "Onetime Oscar",
    speaker_plan: "free",
    sub: {
      plan: "organizer_onetime",
      status: "active",
      event_start: iso(now - 1 * DAY),
      event_end: iso(now + 4 * DAY),
      activated_at: iso(now - 1 * DAY),
    },
    note: "One-time purchase, event window is NOW => LIVE access.",
  },
  {
    key: "organizer-onetime-prep",
    email: "test.onetime.prep@evoca.test",
    name: "Prep Pablo",
    speaker_plan: "free",
    sub: {
      plan: "organizer_onetime",
      status: "active",
      event_start: iso(now + 10 * DAY),
      event_end: iso(now + 13 * DAY),
    },
    note: "One-time purchase, event window in the FUTURE => PREP only (no presenting/reactions/Q&A).",
  },
  {
    key: "organizer-onetime-unset",
    email: "test.onetime.unset@evoca.test",
    name: "Unset Ursula",
    speaker_plan: "free",
    sub: { plan: "organizer_onetime", status: "active", event_start: null, event_end: null },
    note: "One-time purchase, no window chosen yet => PREP only.",
  },
  {
    key: "organizer-expired",
    email: "test.expired@evoca.test",
    name: "Expired Ed",
    speaker_plan: "free",
    sub: { plan: "organizer_monthly", status: "cancelled" },
    note: "Cancelled subscription => NO access (content locked).",
  },
  {
    key: "organizer-grace",
    email: "test.grace@evoca.test",
    name: "Grace Graham",
    speaker_plan: "free",
    sub: { plan: "organizer_monthly", status: "payment_failed" },
    note: "Subscription payment failed => PREP grace access.",
  },
  {
    key: "both",
    email: "test.both@evoca.test",
    name: "Both Bianca",
    speaker_plan: "speaker_pro_monthly",
    sub: { plan: "organizer_annual", status: "active" },
    note: "Dual identity: Speaker Pro AND active organizer (annual). Full access both views.",
  },
  {
    key: "affiliated-speaker",
    email: "test.affiliated@evoca.test",
    name: "Affiliated Aaron",
    speaker_plan: "free",
    affiliateTo: "organizer-live",
    note: "Free speaker invited+accepted to organizer-live's live conference => event-scoped Pro.",
  },
]

async function getUsersByEmail() {
  const map = new Map()
  let page = 1
  // paginate through all users
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) map.set(u.email?.toLowerCase(), u.id)
    if (data.users.length < 1000) break
    page += 1
  }
  return map
}

async function ensureUser(email, existing) {
  const found = existing.get(email.toLowerCase())
  if (found) return found
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser(${email}): ${error.message}`)
  return data.user.id
}

async function upsertSpeaker(userId, email, name, speakerPlan) {
  await supabase.from("speakers").delete().eq("user_id", userId)
  const { error } = await supabase.from("speakers").insert({
    id: userId,
    user_id: userId,
    email,
    name,
    display_name: name,
    username: email.split("@")[0].replace(/\./g, "-"),
    speaker_plan: speakerPlan,
    is_pro: speakerPlan !== "free",
    plan: speakerPlan === "free" ? "free" : "pro",
  })
  if (error) throw new Error(`speaker insert(${email}): ${error.message}`)
}

async function upsertSubscription(userId, sub) {
  await supabase.from("organizer_subscriptions").delete().eq("user_id", userId)
  if (!sub) return null
  const row = {
    user_id: userId,
    plan: sub.plan,
    status: sub.status,
    event_start: sub.event_start ?? null,
    event_end: sub.event_end ?? null,
    activated_at: sub.activated_at ?? null,
    stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
    stripe_subscription_id:
      sub.plan === "organizer_onetime" ? null : `sub_test_${userId.slice(0, 8)}`,
  }
  const { data, error } = await supabase
    .from("organizer_subscriptions")
    .insert(row)
    .select("id")
    .single()
  if (error) throw new Error(`subscription insert: ${error.message}`)
  return data.id
}

async function seedConferenceFor(userId, subId) {
  // Clean prior test conference(s) for this owner.
  await supabase.from("conferences").delete().eq("user_id", userId)
  const { data: conf, error } = await supabase
    .from("conferences")
    .insert({ user_id: userId, subscription_id: subId, name: "Evoca Test Conf 2026" })
    .select("id")
    .single()
  if (error) throw new Error(`conference insert: ${error.message}`)
  const { data: day, error: dErr } = await supabase
    .from("conference_days")
    .insert({ conference_id: conf.id, label: "Day 1", sort_order: 0 })
    .select("id")
    .single()
  if (dErr) throw new Error(`day insert: ${dErr.message}`)
  return { conferenceId: conf.id, dayId: day.id }
}

async function main() {
  console.log("[seed] loading existing users…")
  const existing = await getUsersByEmail()
  const created = {}

  // Pass 1: users, speakers, subscriptions, conferences.
  for (const acc of ACCOUNTS) {
    const userId = await ensureUser(acc.email, existing)
    await upsertSpeaker(userId, acc.email, acc.name, acc.speaker_plan)
    const subId = await upsertSubscription(userId, acc.sub)
    created[acc.key] = { userId, subId, email: acc.email }
    if (acc.seedConference) {
      const { conferenceId, dayId } = await seedConferenceFor(userId, subId)
      created[acc.key].conferenceId = conferenceId
      created[acc.key].dayId = dayId
    }
    console.log(`[seed] ✓ ${acc.key.padEnd(24)} ${acc.email}`)
  }

  // Pass 2: affiliations (need conference owner seeded first).
  for (const acc of ACCOUNTS) {
    if (!acc.affiliateTo) continue
    const target = created[acc.affiliateTo]
    const self = created[acc.key]
    if (!target?.conferenceId) {
      console.warn(`[seed] ! ${acc.key} cannot affiliate: ${acc.affiliateTo} has no conference`)
      continue
    }
    await supabase.from("event_speaker_affiliations").delete().eq("event_id", target.conferenceId).eq("email", acc.email)
    // assign the speaker to a slot for realism
    await supabase.from("conference_slots").insert({
      day_id: target.dayId,
      title: "Keynote: The Future of Conferences",
      type: "keynote",
      duration: 45,
      sort_order: 0,
      speaker_id: self.userId,
      speaker_email: acc.email,
    })
    const { error } = await supabase.from("event_speaker_affiliations").insert({
      event_id: target.conferenceId,
      speaker_id: self.userId,
      invited_by: target.userId,
      email: acc.email,
      status: "accepted",
    })
    if (error) throw new Error(`affiliation insert: ${error.message}`)
    console.log(`[seed] ✓ affiliation ${acc.key} -> ${acc.affiliateTo}`)
  }

  console.log("\n[seed] done. Accounts:")
  for (const acc of ACCOUNTS) {
    console.log(`  ${acc.key.padEnd(24)} ${acc.email.padEnd(34)} ${acc.note}`)
  }
}

main().catch((e) => {
  console.error("[seed] failed:", e)
  process.exit(1)
})
