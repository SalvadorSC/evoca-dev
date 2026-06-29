/**
 * Generates docs/evoca-test-plan.xlsx — a tracked QA test plan.
 * Run: node scripts/generate-test-plan.mjs
 */
import ExcelJS from "exceljs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "docs", "evoca-test-plan.xlsx")

// Brand-ish palette
const YELLOW = "FFF7E018"
const DARK = "FF0A0A0A"
const GREY = "FFEBEBEB"
const PASS = "FFD7F5DD"
const FAIL = "FFF8D7DA"
const BLOCK = "FFFFE9C7"

const STATUSES = ["Not Started", "Pass", "Fail", "Blocked", "N/A"]

// Coverage tier colors for the "Automated" column.
const AUTO_E2E = "FFD7F5DD" // green — exercised by Playwright
const AUTO_UNIT = "FFDDEBFF" // blue — covered by Vitest unit tests
const AUTO_PARTIAL = "FFFFF3C7" // amber — partially/smoke covered
const AUTO_MANUAL = "FFF0F0F0" // grey — manual only

/**
 * Maps each test case (by TC id) to its automated coverage.
 *   kind: "E2E" | "Unit" | "E2E (smoke)" | "Unit + E2E" | "Manual"
 *   ref:  the spec/test that exercises it
 * Anything not listed defaults to Manual.
 */
const AUTOMATION = {
  // Auth & Access
  "TC-001": ["E2E", "dashboard.spec.ts › auth setup + dashboard"],
  "TC-002": ["E2E", "auth.setup.ts (dev-login via URL)"],
  "TC-003": ["E2E", "dashboard.spec.ts › Protected routes"],
  "TC-004": ["E2E", "dashboard.spec.ts › Free account paywall"],
  "TC-005": ["E2E", "features-authed.spec.ts › Conference scheduling"],
  "TC-006": ["Unit", "billing.test.ts (PREP access window)"],
  "TC-007": ["Unit", "billing.test.ts (expired → none)"],
  "TC-008": ["Unit", "billing.test.ts (grace → prep)"],

  // Billing & Paywall
  "TC-009": ["E2E", "features-public.spec.ts › Pricing page (feat-023)"],
  "TC-010": ["Unit + E2E", "locale.test.ts + features-authed.spec.ts (pricing currency)"],
  "TC-011": ["E2E (smoke)", "features-authed.spec.ts › Stripe upgrade flow"],
  "TC-012": ["E2E", "features-authed.spec.ts › Account page (plan section)"],
  "TC-013": ["Unit", "plans.test.ts (plan catalog / paywall tiers)"],

  // Conference Management
  "TC-014": ["E2E", "features-authed.spec.ts › Conference scheduling"],
  "TC-015": ["E2E", "features-authed.spec.ts › Conference scheduling"],
  "TC-016": ["E2E", "features-authed.spec.ts › Conference scheduling"],
  "TC-017": ["E2E", "features-authed.spec.ts › Conference scheduling"],
  "TC-018": ["E2E", "features-authed.spec.ts › Speaker conference talk portal"],

  // Call for Papers
  "TC-019": ["E2E", "features-authed.spec.ts › CFP organizer area"],
  "TC-020": ["Manual", "CFP public submission (manual QA)"],
  "TC-021": ["Manual", "CFP review board (manual QA)"],
  "TC-022": ["Manual", "CFP reject/waitlist (manual QA)"],

  // Talks & Slides
  "TC-023": ["E2E", "features-authed.spec.ts › Talk slides (new-talk flow)"],
  "TC-024": ["E2E", "features-authed.spec.ts › Talk slides (embed URL)"],
  "TC-025": ["E2E", "features-authed.spec.ts › Talk slides (PDF/PPTX upload)"],
  "TC-026": ["Manual", "Slide confirm-step preview (manual QA)"],

  // Presentation & Remote
  "TC-027": ["Manual", "Presenter slide render (manual QA — needs live session)"],
  "TC-028": ["E2E (smoke)", "features-live.spec.ts › Speaker phone remote"],
  "TC-029": ["Unit + E2E", "remote-token.test.ts + features-live.spec.ts (remote token)"],

  // Live Q&A & Wall
  "TC-030": ["E2E (smoke)", "features-live.spec.ts › Q&A attendee view"],
  "TC-031": ["Unit", "anon-id.test.ts / lib-misc.test.ts (reaction identity)"],
  "TC-032": ["Manual", "Q&A moderation propagation (manual QA — needs 2 clients)"],
  "TC-033": ["E2E (smoke)", "features-live.spec.ts › Live wall"],

  // Streams & Public Page
  "TC-034": ["Unit", "dailymotion.test.ts (URL/ID parsing for add-stream)"],
  "TC-035": ["Unit", "dailymotion.test.ts (rejects invalid URL)"],
  "TC-036": ["Manual", "Featured-stream toggle (manual QA)"],
  "TC-037": ["E2E", "features-public.spec.ts › Public conference page"],
  "TC-038": ["E2E", "features-public.spec.ts › Public conference page (renders)"],
  "TC-039": ["E2E", "features-public.spec.ts › Public conference page (track switch)"],
  "TC-040": ["E2E", "features-public.spec.ts › Public conference page (schedule)"],
  "TC-041": ["E2E", "features-public.spec.ts › unpublished slug 404"],

  // Responsive & A11y
  "TC-042": ["Manual", "Responsive sweep (manual QA)"],
  "TC-043": ["Manual", "Keyboard navigation (manual QA)"],
  "TC-044": ["Manual", "Hover/cursor states (manual QA)"],
  "TC-045": ["E2E", "features-public.spec.ts › Theme switcher (feat-011)"],
}

function autoFill(kind) {
  if (kind === "Manual") return AUTO_MANUAL
  if (kind.includes("smoke")) return AUTO_PARTIAL
  if (kind === "Unit") return AUTO_UNIT
  return AUTO_E2E // E2E or Unit + E2E
}

/** Test cases: [Area, Feature, Test Case, Steps, Expected Result, Test Account, Route, Priority] */
const CASES = [
  // Auth & Access
  ["Auth & Access", "Dev login", "Sign in via dev panel", "Open /login → click an account in the Dev only panel", "Lands on /dashboard signed in as that account", "any", "/login", "High"],
  ["Auth & Access", "Dev login", "Sign in via URL", "GET /api/dev-login?as=organizer-live", "Session set, redirected to dashboard", "organizer-live", "/api/dev-login", "Medium"],
  ["Auth & Access", "Route protection", "Protected route while logged out", "Sign out, visit /dashboard", "Redirected to /login", "—", "/dashboard", "High"],
  ["Auth & Access", "Access state", "Free has no organizer access", "Login as free; attempt a gated organizer action", "Paywall opens; action blocked", "free", "/dashboard/conference", "High"],
  ["Auth & Access", "Access state", "Organizer LIVE full access", "Login as organizer-live; run a gated action", "Action proceeds, no paywall", "organizer-live", "/dashboard/conference", "High"],
  ["Auth & Access", "Access state", "One-time PREP before window", "Login as organizer-onetime-prep; try to present/Q&A", "Setup allowed; live actions blocked", "organizer-onetime-prep", "/dashboard/conference", "High"],
  ["Auth & Access", "Access state", "Expired = NONE", "Login as organizer-expired; click gated action", "Content visible; paywall on action", "organizer-expired", "/dashboard", "Medium"],
  ["Auth & Access", "Access state", "Grace = PREP", "Login as organizer-grace", "Prep access granted; live blocked", "organizer-grace", "/dashboard/conference", "Medium"],

  // Billing & Paywall
  ["Billing & Paywall", "Pricing", "Pricing renders", "Visit / and /pricing", "Plans + prices display correctly", "any", "/pricing", "High"],
  ["Billing & Paywall", "Currency", "EUR vs USD by region", "Check /api/locale response / pricing currency", "EU shows EUR, non-EU shows USD", "any", "/pricing", "Medium"],
  ["Billing & Paywall", "Checkout", "Start checkout (test mode)", "From pricing, start an organizer plan checkout", "Stripe Checkout opens with correct amount", "free", "/pricing", "High"],
  ["Billing & Paywall", "Account", "Manage plan", "Open /dashboard/account", "Plan + manage/portal controls show", "organizer-live", "/dashboard/account", "Medium"],
  ["Billing & Paywall", "Paywall", "Paywall modal copy/CTA", "Trigger paywall as free user", "Modal explains plan + links to pricing", "free", "/dashboard/conference", "Medium"],

  // Conference Management
  ["Conference Mgmt", "Create", "Create conference", "As organizer-live, create a conference", "Conference created, appears in list", "organizer-live", "/dashboard/conference", "High"],
  ["Conference Mgmt", "Days", "Add/rename day", "Add a day, rename it inline, save", "Day persists with new label", "organizer-live", "/dashboard/conference/[id]", "High"],
  ["Conference Mgmt", "Slots", "Add slot with track", "Add a slot (type, start, duration, track)", "Slot appears in timeline under track", "organizer-live", "/dashboard/conference/[id]", "High"],
  ["Conference Mgmt", "Slots", "Edit/delete slot", "Edit a slot's fields; delete another", "Edits persist; deleted slot removed", "organizer-live", "/dashboard/conference/[id]", "Medium"],
  ["Conference Mgmt", "Speakers", "Assign speaker by email", "Assign a speaker to a slot via email", "Affiliation created (pending)", "organizer-live", "/dashboard/conference/[id]", "Medium"],

  // Call for Papers
  ["Call for Papers", "Settings", "Enable CFP + custom questions", "Open CFP settings, enable, add a question", "Settings + questions saved", "organizer-live", "/dashboard/conference/[id]/cfp", "High"],
  ["Call for Papers", "Submission", "Public proposal submit", "Logged out, open /cfp/[slug], submit", "Submission recorded, confirmation shown", "—", "/cfp/[slug]", "High"],
  ["Call for Papers", "Review", "Rate + accept proposal", "Open review board, rate, accept one", "Creates unscheduled slot + pending affiliation", "organizer-live", "/dashboard/conference/[id]/cfp/review", "High"],
  ["Call for Papers", "Review", "Reject / waitlist", "Reject and waitlist proposals", "Statuses update; (email if configured)", "organizer-live", "/dashboard/conference/[id]/cfp/review", "Medium"],

  // Talks & Slides
  ["Talks & Slides", "Create talk", "New talk wizard", "Walk /dashboard/talks/new steps", "Talk created and listed", "speaker-pro", "/dashboard/talks/new", "High"],
  ["Talks & Slides", "Slides URL", "Embed slide URL", "On slides step, paste an embed URL", "URL accepted; iframe preview on confirm step", "speaker-pro", "/dashboard/talks/new", "High"],
  ["Talks & Slides", "Slides file", "Upload PDF/PPTX", "Upload a PDF or PPTX file", "Slides extracted; thumbnail grid preview on confirm", "speaker-pro", "/dashboard/talks/new", "High"],
  ["Talks & Slides", "Slides preview", "Confirm-step preview", "Reach step 3 after adding slides", "Preview matches chosen source (grid or iframe)", "speaker-pro", "/dashboard/talks/new", "Medium"],

  // Presentation & Remote
  ["Presentation", "Present", "Render slides", "Open /present/[sessionId]", "Slides render; navigation works", "speaker-pro", "/present/[sessionId]", "High"],
  ["Presentation", "Remote", "Open phone remote", "Click phone-remote QR / open /remote/[token]", "Remote loads, authenticated to session", "speaker-pro", "/remote/[token]", "High"],
  ["Presentation", "Remote", "Advance slides from phone", "Use remote next/prev", "Presenter view updates live", "speaker-pro", "/remote/[token]", "High"],

  // Live Q&A & Wall
  ["Q&A & Wall", "Ask", "Submit question", "Attendee opens /qna/[sessionId], asks", "Question appears in queue", "—", "/qna/[sessionId]", "High"],
  ["Q&A & Wall", "Reactions", "Send reaction", "Send reactions from attendee view", "Reactions register live", "—", "/qna/[sessionId]", "Medium"],
  ["Q&A & Wall", "Moderation", "Flag/delete/ban", "As mod in /present, flag, delete, ban", "Actions propagate to all clients", "speaker-pro", "/present/[sessionId]", "High"],
  ["Q&A & Wall", "Wall", "Live wall display", "Open /wall", "Questions/reactions show on big screen", "—", "/wall", "Medium"],

  // Public Conference Page & Streams (new)
  ["Streams & Public Page", "Add stream", "Add per-track stream", "Live streams section: paste Dailymotion URL/ID + label", "Stream saved under the track", "ssc2324@proton.me", "/dashboard/conference/[id]", "High"],
  ["Streams & Public Page", "Validation", "Reject invalid URL", "Paste a non-Dailymotion / garbage value", "Inline error; not saved", "ssc2324@proton.me", "/dashboard/conference/[id]", "Medium"],
  ["Streams & Public Page", "Featured", "Mark featured stream", "Mark one stream Featured", "Only one featured; others cleared", "ssc2324@proton.me", "/dashboard/conference/[id]", "High"],
  ["Streams & Public Page", "Publish", "Publish toggle + link", "Flip Publish on", "Public /c/<slug> link appears + copyable", "ssc2324@proton.me", "/dashboard/conference/[id]", "High"],
  ["Streams & Public Page", "Public page", "View published page", "Open /c/<slug> logged out", "Featured stream + schedule render", "—", "/c/[slug]", "High"],
  ["Streams & Public Page", "Track switch", "Switch track stream", "Use the track switcher on the public page", "Player swaps to the selected track", "—", "/c/[slug]", "High"],
  ["Streams & Public Page", "Schedule", "Read-only schedule", "Scroll the public schedule", "Days/slots/tracks show, no edit controls", "—", "/c/[slug]", "Medium"],
  ["Streams & Public Page", "Negative", "Unpublished 404", "Open the slug of an unpublished conference", "Returns 404", "—", "/c/[slug]", "High"],

  // Responsive & A11y
  ["Responsive & A11y", "Mobile", "Key pages at 375px", "Resize to mobile; check dashboard, public page, forms", "Layouts adapt, no overflow", "any", "various", "Medium"],
  ["Responsive & A11y", "Keyboard", "Keyboard navigation", "Tab through forms, dialogs, schedule", "All controls reachable + operable", "any", "various", "Medium"],
  ["Responsive & A11y", "Buttons", "Cursor + hover states", "Hover action buttons in light & dark", "Pointer cursor + visible hover; good contrast", "any", "various", "Low"],
  ["Responsive & A11y", "Theme", "Light/dark contrast", "Toggle theme; review yellow buttons/badges", "Text legible on yellow in both themes", "any", "various", "Low"],
]

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } }
    cell.font = { bold: true, color: { argb: YELLOW }, size: 11 }
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
    cell.border = { bottom: { style: "thin", color: { argb: "FF333333" } } }
  })
  row.height = 22
}

async function main() {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Evoca QA"
  wb.created = new Date()

  // ── Instructions sheet ──────────────────────────────────────────────
  const intro = wb.addWorksheet("Instructions", { properties: { tabColor: { argb: YELLOW } } })
  intro.columns = [{ width: 22 }, { width: 90 }]
  const introRows = [
    ["Evoca — Test Plan", ""],
    ["", ""],
    ["How to use", "Work through the 'Test Plan' sheet top to bottom. For each row, sign in with the listed Test Account, go to the Route, follow the Steps, and compare against Expected Result."],
    ["Recording", "Set Status from the dropdown. Add Actual Result (esp. on Fail), your name in Tester, and the Date."],
    ["Status legend", "Not Started · Pass · Fail · Blocked · N/A"],
    ["Automated column", "Shows how each case is automated: E2E (Playwright), Unit (Vitest), Unit + E2E, E2E (smoke = shell/initiation only), or Manual. 'Test Ref' names the exact spec/test."],
    ["Run automation", "Unit: pnpm test (or pnpm test:coverage, 80% gate on lib/). E2E: pnpm test:e2e. See tests/README.md."],
    ["Coverage", "See the Summary sheet for execution status AND the automation breakdown (how much of the plan is automated vs manual-only)."],
    ["Dev login", "Use /login Dev only panel, or GET /api/dev-login?as=<key>. Dev shortcuts are disabled in production."],
    ["Manual QA account", "ssc2324@proton.me owns 'Test Conference 2026' (published, with stream + schedule) and a talk 'Building Realtime Apps'."],
    ["Companion doc", "See docs/testing-guide.md for full walkthroughs and known limitations."],
    ["Known limits", "Dailymotion is embed-only (no in-app stream creation yet); Speaker Pro not surfaced; emails only with RESEND_API_KEY; Phase 6 polish unfinished."],
  ]
  introRows.forEach((r, i) => {
    const row = intro.addRow(r)
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 16, color: { argb: DARK } }
      row.height = 26
    } else {
      row.getCell(1).font = { bold: true, color: { argb: DARK } }
      row.getCell(2).alignment = { wrapText: true, vertical: "top" }
    }
  })

  // ── Test Plan sheet ─────────────────────────────────────────────────
  const ws = wb.addWorksheet("Test Plan", {
    properties: { tabColor: { argb: DARK } },
    views: [{ state: "frozen", ySplit: 1 }],
  })
  const headers = ["ID", "Area", "Feature", "Test Case", "Steps", "Expected Result", "Test Account", "Route", "Priority", "Automated", "Test Ref", "Status", "Actual Result", "Tester", "Date"]
  ws.columns = [
    { width: 7 }, { width: 20 }, { width: 16 }, { width: 26 }, { width: 40 },
    { width: 40 }, { width: 22 }, { width: 28 }, { width: 9 }, { width: 13 },
    { width: 42 }, { width: 13 }, { width: 32 }, { width: 12 }, { width: 12 },
  ]
  styleHeader(ws.addRow(headers))

  CASES.forEach((c, i) => {
    const id = `TC-${String(i + 1).padStart(3, "0")}`
    const [area, feature, testCase, steps, expected, account, route, priority] = c
    const [autoKind, autoRef] = AUTOMATION[id] ?? ["Manual", "Manual QA only"]
    const row = ws.addRow([id, area, feature, testCase, steps, expected, account, route, priority, autoKind, autoRef, "Not Started", "", "", ""])
    row.alignment = { vertical: "top", wrapText: true }
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } }
      })
    }
    // Color the Automated cell by coverage tier (overrides zebra).
    const autoCell = row.getCell(10)
    autoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: autoFill(autoKind) } }
    autoCell.font = { bold: true, size: 10 }
  })

  const lastRow = ws.rowCount
  // Status dropdown + conditional coloring (Status is now column L)
  const statusCol = "L"
  for (let r = 2; r <= lastRow; r++) {
    ws.getCell(`${statusCol}${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${STATUSES.join(",")}"`],
    }
  }
  ws.addConditionalFormatting({
    ref: `${statusCol}2:${statusCol}${lastRow}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "Pass", priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: PASS } } } },
      { type: "containsText", operator: "containsText", text: "Fail", priority: 2, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: FAIL } } } },
      { type: "containsText", operator: "containsText", text: "Blocked", priority: 3, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: BLOCK } } } },
    ],
  })
  ws.autoFilter = { from: "A1", to: `O1` }

  // ── Summary sheet ───────────────────────────────────────────────────
  const sum = wb.addWorksheet("Summary", { properties: { tabColor: { argb: GREY } } })
  sum.columns = [{ width: 18 }, { width: 12 }, { width: 14 }]
  const total = CASES.length

  // Execution status (manual run-through tracking) — Status is column L.
  styleHeader(sum.addRow(["Status", "Count", "% of Total"]))
  STATUSES.forEach((s) => {
    const row = sum.addRow([s, { formula: `COUNTIF('Test Plan'!L2:L${lastRow},"${s}")` }, { formula: `COUNTIF('Test Plan'!L2:L${lastRow},"${s}")/${total}` }])
    row.getCell(3).numFmt = "0%"
  })
  sum.addRow([])
  const totalRow = sum.addRow(["Total", total, ""])
  totalRow.getCell(1).font = { bold: true }
  totalRow.getCell(2).font = { bold: true }

  // Automation coverage breakdown — Automated is column J.
  sum.addRow([])
  styleHeader(sum.addRow(["Automation", "Count", "% of Total"]))
  const autoKinds = ["E2E", "Unit + E2E", "E2E (smoke)", "Unit", "Manual"]
  autoKinds.forEach((k) => {
    const row = sum.addRow([k, { formula: `COUNTIF('Test Plan'!J2:J${lastRow},"${k}")` }, { formula: `COUNTIF('Test Plan'!J2:J${lastRow},"${k}")/${total}` }])
    row.getCell(3).numFmt = "0%"
  })
  const autoTotalRow = sum.addRow([
    "Automated (any)",
    { formula: `${total}-COUNTIF('Test Plan'!J2:J${lastRow},"Manual")` },
    { formula: `(${total}-COUNTIF('Test Plan'!J2:J${lastRow},"Manual"))/${total}` },
  ])
  autoTotalRow.getCell(1).font = { bold: true }
  autoTotalRow.getCell(2).font = { bold: true }
  autoTotalRow.getCell(3).font = { bold: true }
  autoTotalRow.getCell(3).numFmt = "0%"

  await wb.xlsx.writeFile(OUT)
  console.log(`[v0] Wrote ${OUT} with ${total} test cases`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
