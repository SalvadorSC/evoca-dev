// ─────────────────────────────────────────────────────────────────────────────
// EVOCA — Privacy Policy (canonical source)
//
// This is the single source of truth for the published /privacy page. It was
// drafted to satisfy GDPR Article 13 and CCPA/CPRA disclosure requirements,
// following the `privacy-policy-generator` skill — generated from a scan of the
// codebase's actual data-collection signals (Supabase auth, Stripe payments,
// Vercel cookieless Analytics, theme local storage; no ad/cross-site trackers).
//
// ⚠️  IMPORTANT: This text is AI-generated and is a DRAFTING STARTING POINT ONLY.
// It is not legal advice and creates no attorney-client relationship. Have a
// qualified attorney licensed in your jurisdiction review it before relying on
// it. Search for `[VERIFY]` to find every assumption that must be confirmed.
// ─────────────────────────────────────────────────────────────────────────────

export const PRIVACY_LAST_UPDATED = "June 30, 2026"
export const PRIVACY_EFFECTIVE_DATE = "June 30, 2026"

export const PRIVACY_MARKDOWN = `# Privacy Policy

**Last updated:** ${PRIVACY_LAST_UPDATED}  
**Effective date:** ${PRIVACY_EFFECTIVE_DATE}

> **Legal disclaimer.** This Privacy Policy was prepared with the assistance of an automated drafting tool. It is provided as a starting point only, does not constitute legal advice, and creates no attorney-client relationship. EVOCA recommends review by a qualified attorney licensed in the relevant jurisdiction before publication or reliance.

This Privacy Policy explains how EVOCA ("EVOCA", "we", "us", or "our") collects, uses, shares, and protects personal data when you use EVOCA (the "Service") at [evoca.dev](https://evoca.dev). EVOCA provides real-time audience engagement for talks and events, including live reactions, Q&A, polls, and tools for organizers to manage schedules and speakers.

This policy works alongside our [Terms of Service](https://evoca.dev/terms).

---

## 1. Who We Are (Data Controller)

> **Plain English:** EVOCA decides how and why your personal data is processed, which makes us the "data controller." Here's how to reach us about anything privacy-related.

For the purposes of the GDPR and similar laws, EVOCA is the data controller for personal data processed through the Service. You can contact us about privacy at [privacy@evoca.dev](mailto:privacy@evoca.dev) [VERIFY].

- **Legal entity:** [VERIFY: add the registered company name.]
- **Mailing address:** [VERIFY: add a physical mailing address.]
- **Data Protection Officer:** [VERIFY: add DPO contact if one is appointed; otherwise state none is required.]

---

## 2. Personal Data We Collect

> **Plain English:** We collect the email you sign in with, anything you choose to add (like a display name), the content you submit during events, payment details (handled by Stripe), and some basic technical/usage data.

We collect the following categories of personal data:

- **Account data.** Your email address, used for passwordless ("magic link") sign-in, and any optional display name you provide.
- **User Content.** Content you submit through the Service, such as audience questions, reactions, poll responses, talk and session details, and call-for-papers submissions. Audience participation can be submitted anonymously, but any text you include is processed by us.
- **Payment data.** If you purchase a paid plan, our payment processor (Stripe) collects and processes your payment details. We do not store full card numbers; we receive limited billing information such as a transaction identifier and subscription status. [VERIFY: confirm exactly what billing data is stored.]
- **Technical and usage data.** IP address, device and browser type, and aggregated/anonymized usage analytics collected via Vercel Analytics to understand how the Service is used.
- **Cookies and similar technologies.** Strictly necessary cookies used for authentication and to operate the Service. [VERIFY: confirm whether any non-essential analytics/marketing cookies are used and add a cookie banner if so.]

We do not knowingly collect personal data from children under 16. [VERIFY: confirm minimum age.]

---

## 3. How and Why We Use Your Data (Purposes & Legal Bases)

> **Plain English:** We use your data to run the Service, sign you in, process payments, keep things secure, and improve the product. Under GDPR, each use has a "legal basis," shown below.

| Purpose | Personal data used | Legal basis (GDPR) |
|---------|--------------------|--------------------|
| Create and manage your account; authenticate sign-in | Account data | Performance of a contract |
| Provide live engagement features (reactions, Q&A, polls) | User Content | Performance of a contract |
| Process payments and manage subscriptions | Payment data | Performance of a contract |
| Keep the Service secure and prevent abuse | Technical data | Legitimate interests |
| Measure and improve performance and usage | Usage/analytics data | Legitimate interests (or consent where required) |
| Send service-related communications | Account data | Performance of a contract |
| Comply with legal obligations | As required | Legal obligation |

Where we rely on consent (for example, non-essential cookies in some regions), you may withdraw it at any time.

---

## 4. How We Share Your Data (Sub-processors & Third Parties)

> **Plain English:** We don't sell your data. We share it only with the trusted vendors that help us run EVOCA, and only as needed.

We share personal data with the following categories of service providers ("sub-processors") who process it on our behalf under appropriate agreements:

| Sub-processor | Purpose | Data involved |
|---------------|---------|---------------|
| Supabase | Authentication and database hosting | Account data, User Content |
| Stripe | Payment processing | Payment/billing data |
| Vercel | Application hosting and analytics | Technical/usage data, server logs |

[VERIFY: confirm this list is complete and add any other vendors such as email delivery providers.]

We may also disclose personal data to comply with legal obligations, enforce our Terms, protect rights and safety, or in connection with a merger, acquisition, or sale of assets (with notice where required). **We do not sell your personal information, and we do not "share" it for cross-context behavioral advertising** as those terms are defined under California law.

---

## 5. International Data Transfers

> **Plain English:** Our vendors may process data outside your country, including in the United States. When that happens, we use legally recognized safeguards.

Your personal data may be processed in countries outside the EEA, UK, or your home country, including the United States. Where we transfer data internationally, we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses. [VERIFY: confirm transfer mechanisms with each sub-processor.]

---

## 6. How Long We Keep Your Data (Retention)

> **Plain English:** We keep data only as long as we need it — for your account while it's active, and for limited periods afterward for legal and operational reasons.

| Data | Retention period |
|------|------------------|
| Account data | For the life of your account, then deleted or anonymized within [VERIFY: e.g., 30–90] days of account closure |
| User Content | For the life of the associated event/account, unless you delete it sooner [VERIFY] |
| Payment records | As required by tax and accounting law (typically up to 7 years) [VERIFY] |
| Server logs | Short-term, typically [VERIFY: e.g., 30 days] |
| Analytics data | Aggregated/anonymized; retained per Vercel Analytics defaults [VERIFY] |

---

## 7. Your Rights

> **Plain English:** Depending on where you live, you have rights over your data — to see it, correct it, delete it, or object to how we use it. Just email us and we'll help.

### 7.1 GDPR (EEA / UK)

If you are in the EEA or UK, you have the right to: access your data; rectify inaccurate data; erase your data; restrict or object to processing; data portability; and withdraw consent at any time. You also have the right to lodge a complaint with your local supervisory authority. To exercise these rights, contact [privacy@evoca.dev](mailto:privacy@evoca.dev) [VERIFY]. We will respond within the timeframes required by law.

### 7.2 CCPA / CPRA (California)

If you are a California resident, you have the right to: know what personal information we collect and how it is used; request deletion of your personal information; correct inaccurate personal information; and opt out of the sale or sharing of personal information. **We do not sell or share personal information.** You have the right not to receive discriminatory treatment for exercising these rights. To make a request, contact [privacy@evoca.dev](mailto:privacy@evoca.dev) [VERIFY].

### 7.3 Other Regions

Residents of other jurisdictions (for example, Canada under PIPEDA) may have similar rights. Contact us and we will honor applicable rights. [VERIFY]

---

## 8. How We Protect Your Data

> **Plain English:** We use reasonable security measures, but no system is perfectly secure. Sign-in is passwordless, so keep your email account safe.

We implement technical and organizational measures designed to protect personal data, including encryption in transit, access controls, and reliance on reputable infrastructure providers. Because EVOCA uses passwordless authentication, the security of your email account is essential to the security of your EVOCA account. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.

---

## 9. Cookies and Similar Technologies

> **Plain English:** We only use what we need to log you in, remember your theme, and measure traffic privately. We don't use advertising or cross-site tracking cookies.

Based on the technologies currently in use, EVOCA uses the following:

| Type | Purpose | Examples in use | Duration |
|------|---------|-----------------|----------|
| Essential | Authentication and session management | Supabase auth session (cookie / local storage) | Session and token lifetime |
| Preference | Remember your interface settings | \`theme\` (light/dark) in browser local storage | Until cleared by you |
| Analytics | Privacy-friendly, aggregated traffic measurement | Vercel Analytics (cookieless by default) | Not applicable (no tracking cookie) |
| Marketing | Advertising / cross-site tracking | None | Not applicable |

We do not use advertising cookies, third-party tracking pixels, Google Analytics, Google Tag Manager, or social media trackers. Vercel Analytics is designed to measure traffic without third-party cookies and without collecting personally identifiable information for advertising. Fonts are self-hosted at build time, so loading a page does not send your data to a third-party font provider.

Because we currently set only strictly necessary and functional storage and use cookieless analytics, a cookie consent banner is not strictly required. [VERIFY: if you later add analytics or marketing cookies that require consent, implement a consent banner (see appendix) that links to this policy and blocks non-essential cookies until consent is given.]

---

## 10. Third-Party Links

> **Plain English:** Our Service may link to other sites we don't control. Their privacy practices are their own.

The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties, and we encourage you to review their policies.

---

## 11. Changes to This Policy

> **Plain English:** If we update this policy, we'll change the date at the top and, for important changes, let you know more prominently.

We may update this Privacy Policy from time to time. We will revise the "Last updated" date above and, for material changes, provide more prominent notice (such as by email or an in-Service notice) where practicable.

---

## 12. Contact Us

> **Plain English:** Questions or requests about your privacy? Here's how to reach us.

- **Privacy requests:** [privacy@evoca.dev](mailto:privacy@evoca.dev) [VERIFY]
- **General support:** [support@evoca.dev](mailto:support@evoca.dev) [VERIFY]
- **Mailing address:** [VERIFY: add a physical mailing address — required under various regulations.]
- **EU/UK supervisory authority:** You have the right to lodge a complaint with your local data protection authority.

---

## Appendix: Cookie Consent (Recommendation)

> **Plain English:** We don't need a cookie banner today because we only use essential/functional storage and cookieless analytics. If that changes, here's what to add.

EVOCA currently sets only strictly necessary and functional storage and uses cookieless analytics, so a consent banner is not required at this time. If non-essential analytics or marketing cookies are introduced later, add a consent banner that:

- Obtains consent **before** setting any non-essential cookies (no pre-checked boxes; "Accept All" must not be the only prominent option) — required under GDPR/ePrivacy.
- Includes a "Do Not Sell or Share My Personal Information" link if any "sale"/"sharing" under CCPA/CPRA begins.
- Offers a preference center where users can toggle cookie categories on and off.
- Links to this Privacy Policy.

---

*Document information — Applicable to: users of EVOCA. Business type: SaaS (real-time event engagement). Data collection intensity: Moderate–Extensive (accounts + forms + payments, no advertising/cross-site tracking). Jurisdiction: [VERIFY]. GDPR applicable: Yes. CCPA applicable: Yes. Sub-processors disclosed: Supabase, Stripe, Vercel.*
`
