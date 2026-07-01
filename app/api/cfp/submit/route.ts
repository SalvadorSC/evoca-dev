import { NextResponse, type NextRequest } from "next/server"
import { submitProposal } from "@/lib/cfp"
import { sendEmail, cfpConfirmationEmail } from "@/lib/email"
import { CFP_ENABLED } from "@/lib/flags"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  slug?: string
  name?: string
  email?: string
  title?: string
  abstract?: string
  talkFormat?: string
  bio?: string
  answers?: { questionId: string; value: unknown }[]
  // Honeypot — must be empty. Bots tend to fill every field.
  website?: string
}

export async function POST(req: NextRequest) {
  if (!CFP_ENABLED) {
    return NextResponse.json({ error: "CFP is not enabled." }, { status: 403 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Honeypot: silently accept (so bots don't learn) but don't store.
  if (body.website && body.website.trim() !== "") {
    return NextResponse.json({ ok: true })
  }

  const { slug, name, email, title, abstract } = body
  if (!slug || !name?.trim() || !email?.trim() || !title?.trim() || !abstract?.trim()) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 })
  }
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const result = await submitProposal({
    slug,
    name,
    email,
    title,
    abstract,
    talkFormat: body.talkFormat || "talk",
    bio: body.bio,
    answers: Array.isArray(body.answers) ? body.answers : [],
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Best-effort confirmation to the submitter (never fails the submission).
  try {
    const { subject, html } = cfpConfirmationEmail({
      speakerName: result.speakerName,
      talkTitle: result.talkTitle,
      talkFormat: result.talkFormat,
      conferenceName: result.conferenceName,
    })
    await sendEmail({ to: email.trim().toLowerCase(), subject, html })
  } catch (mailErr) {
    console.error("[v0] confirmation email failed:", (mailErr as Error).message)
  }

  return NextResponse.json({ ok: true })
}
