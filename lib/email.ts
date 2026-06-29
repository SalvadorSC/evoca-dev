import "server-only"
import { Resend } from "resend"

/**
 * Transactional email via Resend (Phase 7).
 *
 * The client is created lazily so the app still builds/runs without
 * RESEND_API_KEY set — sends become no-ops (logged) until the key is present.
 * This keeps CFP review actions working even if email isn't configured yet.
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
// Shared HTML shell — minimal, inline-styled (email clients ignore <style>).
// ─────────────────────────────────────────────────────────────────────────────

function shell(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141414;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 16px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f5d90a;font-weight:700;">Evoca</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#ffffff;">${heading}</h1>
        </td></tr>
        <tr><td style="padding:0 32px 28px;font-size:15px;line-height:1.6;color:#c9c9c9;">
          ${bodyHtml}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#666;">Sent by Evoca · Conference presentation platform</p>
    </td></tr>
  </table>
</body></html>`
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#f5d90a;color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">${label}</a>`
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// ─────────────────────────────────────────────────────────────────────────────
// CFP templates
// ─────────────────────────────────────────────────────────────────────────────

export function cfpAcceptEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
  signupUrl: string
  hasAccount: boolean
}): { subject: string; html: string } {
  const cta = opts.hasAccount
    ? `<p style="margin:24px 0 0;">${button(opts.signupUrl, "View in your dashboard")}</p>`
    : `<p style="margin:8px 0 24px;">Create your free Evoca account with this email to manage your talk and access the live presentation tools:</p><p style="margin:0;">${button(opts.signupUrl, "Set up your account")}</p>`
  return {
    subject: `Your talk was accepted for ${opts.conferenceName}`,
    html: shell(
      "Your talk was accepted 🎉",
      `<p style="margin:0 0 16px;">Hi ${esc(opts.speakerName)},</p>
       <p style="margin:0 0 16px;">Great news — <strong style="color:#fff;">"${esc(opts.talkTitle)}"</strong> has been accepted for <strong style="color:#fff;">${esc(opts.conferenceName)}</strong>.</p>
       ${cta}`,
    ),
  }
}

export function cfpRejectEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
}): { subject: string; html: string } {
  return {
    subject: `Update on your submission to ${opts.conferenceName}`,
    html: shell(
      "Submission update",
      `<p style="margin:0 0 16px;">Hi ${esc(opts.speakerName)},</p>
       <p style="margin:0 0 16px;">Thank you for submitting <strong style="color:#fff;">"${esc(opts.talkTitle)}"</strong> to <strong style="color:#fff;">${esc(opts.conferenceName)}</strong>.</p>
       <p style="margin:0 0 16px;">After careful review, we're unable to include it in the program this time. We received many strong submissions and had limited slots. We genuinely hope you'll submit again in the future.</p>
       <p style="margin:0;">Thank you for your interest.</p>`,
    ),
  }
}

export function cfpWaitlistEmail(opts: {
  speakerName: string
  talkTitle: string
  conferenceName: string
}): { subject: string; html: string } {
  return {
    subject: `Your submission to ${opts.conferenceName} is waitlisted`,
    html: shell(
      "You're on the waitlist",
      `<p style="margin:0 0 16px;">Hi ${esc(opts.speakerName)},</p>
       <p style="margin:0 0 16px;">Your talk <strong style="color:#fff;">"${esc(opts.talkTitle)}"</strong> for <strong style="color:#fff;">${esc(opts.conferenceName)}</strong> has been placed on our waitlist.</p>
       <p style="margin:0;">If a slot opens up, we'll reach out right away. No action is needed from you for now.</p>`,
    ),
  }
}

export function speakerInviteEmail(opts: {
  talkTitle: string | null
  conferenceName: string
  signupUrl: string
  hasAccount: boolean
}): { subject: string; html: string } {
  const intro = opts.talkTitle
    ? `You've been added as a speaker for <strong style="color:#fff;">"${esc(opts.talkTitle)}"</strong> at <strong style="color:#fff;">${esc(opts.conferenceName)}</strong>.`
    : `You've been added as a speaker at <strong style="color:#fff;">${esc(opts.conferenceName)}</strong>.`
  const cta = opts.hasAccount
    ? `<p style="margin:24px 0 0;">${button(opts.signupUrl, "View in your dashboard")}</p>`
    : `<p style="margin:8px 0 24px;">Create your free Evoca account with this email to manage your talk:</p><p style="margin:0;">${button(opts.signupUrl, "Set up your account")}</p>`
  return {
    subject: `You've been added as a speaker for ${opts.conferenceName}`,
    html: shell("You've been added as a speaker", `<p style="margin:0 0 16px;">${intro}</p>${cta}`),
  }
}
