/**
 * One-time script: grant ssc2324@proton.me a permanent organizer_annual
 * subscription so they bypass all billing/plan limits.
 *
 * Usage:
 *   node --env-file=.env.local scripts/grant-power-admin.mjs
 */
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'ssc2324@proton.me'
const PLAN_ID = 'organizer_annual'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// 1. Find the user
const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
if (listErr) { console.error('listUsers:', listErr.message); process.exit(1) }

const user = users.find(u => u.email === ADMIN_EMAIL)
if (!user) {
  console.error(`User ${ADMIN_EMAIL} not found. Ask them to sign up first.`)
  process.exit(1)
}
console.log(`Found user: ${user.id} (${user.email})`)

// 2. Upsert a permanent active subscription
const { error: upsertErr } = await supabase
  .from('organizer_subscriptions')
  .upsert(
    {
      user_id: user.id,
      plan_id: PLAN_ID,
      status: 'active',
      stripe_customer_id: 'manual_power_admin',
      stripe_subscription_id: `manual_${user.id}`,
      current_period_start: new Date().toISOString(),
      // Far-future expiry so it never lapses
      current_period_end: new Date('2099-12-31').toISOString(),
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' },
  )

if (upsertErr) {
  console.error('upsert error:', upsertErr.message)
  process.exit(1)
}

console.log(`Done. ${ADMIN_EMAIL} now has an active "${PLAN_ID}" subscription.`)
