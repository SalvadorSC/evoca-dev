import "server-only"
import { Resend } from "resend"

/**
 * Transactional email via Resend (Phase 7).
 *
 * The client is created lazily so the app still builds/runs without
 * RESEND_API_KEY set — sends become no-ops (logged) until the key is present.
 * This keeps CFP review actions working even if email isn't configured yet.
 *
 * All templates share one design-system-aligned shell (see `shell`):
 *   - Brand yellow  #F7E018   - Sharp 0px corners (matches --radius: 0)
 *   - Dark surfaces #080808 / #111111 / #1a1a1a, border #2a2a2a
 *   - Mono "EVOCA." wordmark   - No emoji
 *
 * Email types are documented in docs/emails.md — keep that in sync when
 * adding or changing a template.
 */

const FROM = process.env.CFP_EMAIL_FROM || "Evoca <onboarding@resend.dev>"

let _resend: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

export interface SendEmailResult {
  sent: boolean
  skipped?: boolean
  error?: string
}

/**
 * Low-level send. Never throws — returns a result so callers (e.g. CFP review
 * actions) don't fail just because email is misconfigured.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<SendEmailResult> {
  const resend = getResend()
  if (!resend) {
    console.log(`[v0] email skipped (no RESEND_API_KEY): "${opts.subject}" -> ${opts.to}`)
    return { sent: false, skipped: true }
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    })
    if (error) {
      console.error("[v0] Resend error:", error)
      return { sent: false, error: String(error) }
    }
    return { sent: true }
  } catch (err) {
    console.error("[v0] sendEmail threw:", (err as Error).message)
    return { sent: false, error: (err as Error).message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (mirror app/globals.css). Inlined because email clients strip
// <style> and CSS variables.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg: "#080808",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "#2a2a2a",
  yellow: "#F7E018",
  white: "#FFFFFF",
  text: "#B4B4B4",
  muted: "#888888",
} as const

const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────────────────────

/** Primary CTA — sharp corners, brand yellow, mono uppercase label. */
function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${C.yellow};color:${C.bg};font-family:${MONO};font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:13px 26px;">${esc(label)}</a>`
}

/** Left-accented detail panel (e.g. talk summary). Rows: [label, value][]. */
function detailBox(rows: [string, string][]): string {
  const inner = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};white-space:nowrap;vertical-align:top;width:90px;">${esc(label)}</td>
        <td style="padding:4px 0 4px 12px;font-size:14px;color:${C.white};vertical-align:top;">${esc(value)}</td>
      </tr>`,
    )
    .join("")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface2};border-left:3px solid ${C.yellow};margin:20px 0;">
    <tr><td style="padding:16px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table>
    </td></tr>
  </table>`
}

/** The shared HTML shell every email is wrapped in. */
function shell(heading: string, bodyHtml: string, accent: string = C.yellow): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${SANS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.surface};border:1px solid ${C.border};">
        <!-- accent bar -->
        <tr><td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- wordmark -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0;font-family:${MONO};font-size:15px;letter-spacing:5px;text-transform:uppercase;color:${C.white};font-weight:700;">EVOCA<span style="color:${C.yellow};">.</span></p>
        </td></tr>
        <!-- heading -->
        <tr><td style="padding:20px 32px 0;">
          <h1 style="margin:0;font-size:23px;line-height:1.3;color:${C.white};font-weight:700;">${esc(heading)}</h1>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.6;color:${C.text};">
          ${bodyHtml}
        </td></tr>
      </table>
      <!-- footer -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding:16px 8px 0;font-family:${MONO};font-size:11px;letter-spacing:0.5px;color:#5a5a5a;text-align:center;">
          EVOCA · CONFERENCE PRESENTATION PLATFORM
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const greeting = (name: string) =>
  `<p style="margin:0 0 16px;">Hi ${esc(name)},</p>`
const strong = (s: string) => `<strong style="color:${C.white};">${esc(s)}</strong>`

// ─────────────────────────────────────────────────────────────────────────────
// CFP — submission received (confirmation to the submitter)
// ─────────────────────────────────────────────────────────────────────────────

export function cfpConfirmationEmail(opts: {
  speakerName: string
  talkTitle: string
  talkFormat: string
  conferenceName: string
}): { subject: string; html: string } {
  return {
    subject: `We received your submission to ${opts.conferenceName}`,
    html: shell(
      "Submission received",
      `${greeting(opts.speakerName)}
       <p style="margin:0 0 4px;">Thanks for submitting to ${strong(opts.conferenceName)}. Your proposal is in and awaiting review.</p>
       ${detailBox([
         ["Talk", opts.talkTitle],
         ["Format", opts.talkFormat],
       ])}
       <p style="margin:0;">We'll email you as soon as the organizers make a decision. No action is needed in the meantime.</p>`,
    ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CFP — accepted
// ─────────────────────────────────────────────────────────────────────────────

export function cfpAcceptEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
  signupUrl: string
  hasAccount: boolean
}): { subject: string; html: string } {
  const cta = opts.hasAccount
    ? `<p style="margin:24px 0 0;">${button(opts.signupUrl, "View in dashboard")}</p>`
    : `<p style="margin:8px 0 20px;">Create your free Evoca account with this email to manage your talk and access the live presentation tools:</p><p style="margin:0;">${button(opts.signupUrl, "Set up your account")}</p>`
  return {
    subject: `Your talk was accepted for ${opts.conferenceName}`,
    html: shell(
      "Your talk was accepted",
      `${greeting(opts.speakerName)}
       <p style="margin:0 0 4px;">Great news — your talk has been accepted for ${strong(opts.conferenceName)}.</p>
       ${detailBox([["Talk", opts.talkTitle]])}
       ${cta}`,
    ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CFP — waitlisted
// ─────────────────────────────────────────────────────────────────────────────

export function cfpWaitlistEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
}): { subject: string; html: string } {
  return {
    subject: `Your submission to ${opts.conferenceName} is waitlisted`,
    html: shell(
      "You're on the waitlist",
      `${greeting(opts.speakerName)}
       <p style="margin:0 0 4px;">Your talk for ${strong(opts.conferenceName)} has been placed on our waitlist.</p>
       ${detailBox([["Talk", opts.talkTitle]])}
       <p style="margin:0;">If a slot opens up, we'll reach out right away. No action is needed from you for now.</p>`,
    ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CFP — declined
// ─────────────────────────────────────────────────────────────────────────────

export function cfpRejectEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
}): { subject: string; html: string } {
  return {
    subject: `Update on your submission to ${opts.conferenceName}`,
    html: shell(
      "Submission update",
      `${greeting(opts.speakerName)}
       <p style="margin:0 0 4px;">Thank you for submitting ${strong(opts.talkTitle)} to ${strong(opts.conferenceName)}.</p>
       <p style="margin:16px 0 16px;">After careful review, we're unable to include it in the program this time. We received many strong submissions and had limited slots. We genuinely hope you'll submit again in the future.</p>
       <p style="margin:0;">Thank you for your interest.</p>`,
      C.muted,
    ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Speaker invite (also backfills the Phase 2 stub)
// ─────────────────────────────────────────────────────────────────────────────

export function speakerInviteEmail(opts: {
  talkTitle: string | null
  conferenceName: string
  signupUrl: string
  hasAccount: boolean
}): { subject: string; html: string } {
  const intro = opts.talkTitle
    ? `You've been added as a speaker for ${strong(opts.talkTitle)} at ${strong(opts.conferenceName)}.`
    : `You've been added as a speaker at ${strong(opts.conferenceName)}.`
  const cta = opts.hasAccount
    ? `<p style="margin:24px 0 0;">${button(opts.signupUrl, "View in dashboard")}</p>`
    : `<p style="margin:8px 0 20px;">Create your free Evoca account with this email to manage your talk:</p><p style="margin:0;">${button(opts.signupUrl, "Set up your account")}</p>`
  return {
    subject: `You've been added as a speaker for ${opts.conferenceName}`,
    html: shell("You've been added as a speaker", `<p style="margin:0 0 4px;">${intro}</p>${cta}`),
  }
}
