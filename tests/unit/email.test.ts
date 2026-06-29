import { describe, it, expect } from "vitest"
import {
  cfpConfirmationEmail,
  cfpAcceptEmail,
  cfpWaitlistEmail,
  cfpRejectEmail,
  speakerInviteEmail,
} from "@/lib/email"

/**
 * Email template unit tests (CFP feature + speaker invites).
 *
 * These are pure functions returning { subject, html }. We assert on subject
 * wording, that user-provided values are present, and that HTML special chars
 * are escaped (no XSS via names/titles).
 */

describe("cfpConfirmationEmail", () => {
  it("includes the conference name in the subject and the talk details", () => {
    const { subject, html } = cfpConfirmationEmail({
      speakerName: "Ada Lovelace",
      talkTitle: "Analytical Engines",
      talkFormat: "talk",
      conferenceName: "EvocaConf",
    })
    expect(subject).toContain("EvocaConf")
    expect(html).toContain("Ada Lovelace")
    expect(html).toContain("Analytical Engines")
    expect(html).toContain("Submission received")
  })
})

describe("cfpAcceptEmail", () => {
  it("shows a dashboard CTA when the speaker already has an account", () => {
    const { subject, html } = cfpAcceptEmail({
      speakerName: "Grace",
      talkTitle: "Compilers",
      conferenceName: "EvocaConf",
      signupUrl: "https://example.com/dashboard",
      hasAccount: true,
    })
    expect(subject).toContain("accepted")
    expect(html).toContain("View in dashboard")
    expect(html).toContain("https://example.com/dashboard")
  })

  it("shows an account setup CTA when the speaker has no account", () => {
    const { html } = cfpAcceptEmail({
      speakerName: "Grace",
      talkTitle: "Compilers",
      conferenceName: "EvocaConf",
      signupUrl: "https://example.com/signup",
      hasAccount: false,
    })
    expect(html).toContain("Set up your account")
  })
})

describe("cfpWaitlistEmail", () => {
  it("communicates the waitlist state", () => {
    const { subject, html } = cfpWaitlistEmail({
      speakerName: "Linus",
      talkTitle: "Kernels",
      conferenceName: "EvocaConf",
    })
    expect(subject).toContain("waitlisted")
    expect(html).toContain("waitlist")
    expect(html).toContain("Kernels")
  })
})

describe("cfpRejectEmail", () => {
  it("is polite and references the talk title", () => {
    const { subject, html } = cfpRejectEmail({
      speakerName: "Margaret",
      talkTitle: "Apollo Guidance",
      conferenceName: "EvocaConf",
    })
    expect(subject).toContain("EvocaConf")
    expect(html).toContain("Apollo Guidance")
    expect(html).toContain("Submission update")
  })
})

describe("speakerInviteEmail", () => {
  it("mentions the talk title when provided", () => {
    const { subject, html } = speakerInviteEmail({
      talkTitle: "Realtime Web",
      conferenceName: "EvocaConf",
      signupUrl: "https://example.com/signup",
      hasAccount: false,
    })
    expect(subject).toContain("speaker")
    expect(html).toContain("Realtime Web")
    expect(html).toContain("Set up your account")
  })

  it("falls back gracefully when no talk title is given", () => {
    const { html } = speakerInviteEmail({
      talkTitle: null,
      conferenceName: "EvocaConf",
      signupUrl: "https://example.com/dashboard",
      hasAccount: true,
    })
    expect(html).toContain("EvocaConf")
    expect(html).toContain("View in dashboard")
  })
})

describe("HTML escaping (XSS safety)", () => {
  it("escapes angle brackets and ampersands in user-provided values", () => {
    const { html } = cfpConfirmationEmail({
      speakerName: "<script>alert(1)</script>",
      talkTitle: "Tom & Jerry <b>bold</b>",
      talkFormat: "talk",
      conferenceName: "EvocaConf",
    })
    // The raw injected tag must not appear; it should be escaped.
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("Tom &amp; Jerry")
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;")
  })
})
