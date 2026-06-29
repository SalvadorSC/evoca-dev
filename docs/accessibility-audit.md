# Accessibility & Light-Mode Audit

_Last updated: Phase 6 (Polish)_

This document records the whole-app accessibility pass done alongside the light-mode
rollout. It covers what was audited, what was fixed, and what remains.

## Theming architecture (root cause of most light-mode bugs)

The app uses CSS custom properties in `app/globals.css`:

- `:root` holds the **dark** token values (the historical default).
- `.light` (set on `<html>` by `ThemeProvider`) overrides those tokens with light values.
- `.force-dark` re-declares the dark token values on a subtree so **live "stage" screens
  stay dark regardless of the user's chosen theme** (they are designed for projection).
- The `@theme` block maps Tailwind utilities (`bg-jsconf-bg`, `text-foreground`, …) to
  `var(--token)` so every utility flips automatically with the theme.

### Force-dark stage screens

These routes are pinned dark via a small `force-dark` wrapper `layout.tsx`:

- `/wall` — projector Live Wall
- `/present/[sessionId]` — presenter view
- `/speaker` — live speaker control
- `/remote/[token]` — phone remote
- `/qna/[sessionId]` — live Q&A moderation
- `/app` — attendee live experience
- `/demo` — demo of the live experience

## Fixes applied

### Light-mode legibility
- Replaced 38 hardcoded hex colors on the homepage with theme tokens.
- Bulk-replaced `text-white` → `text-foreground` across 28 themed files
  (dashboard, login, CFP, conference, billing, account, admin, auth, not-found).
- Replaced remaining `text-[#888]` / `border-[#1f1f1f]` in the organizer pricing
  section with `text-jsconf-muted` / `border-jsconf-border`.
- Phone-mockup typed text and the real React/Ask tab inputs now use `text-foreground`
  so typed text is visible in light mode.
- Winner badge changed from accent-on-surface (low contrast in light) to a filled
  accent badge with `--accent-text`, plus a `Trophy` icon instead of an emoji.
- Hero waves render near-black (`--wave-color`) in light mode instead of yellow.

### Preserved-on-purpose
- `text-black` on yellow/green fills (buttons, badges) — correct in both themes
  because the fill color does not change between themes.
- `text-destructive-foreground` (white) on the red delete button — correct in both themes.

### ARIA / semantics
- Added `aria-label` to the Speaker Pro waitlist email input (was unlabeled).
- Added `aria-expanded` to FAQ accordion disclosure buttons.
- Theme switcher buttons already expose `aria-label` and `aria-pressed`.
- All `<img>`/`<Image>` usages already have `alt` text (verified, none missing).
- Decorative icons use `aria-hidden="true"`.

## Verified
- Homepage (`?role=speaker`) — no first-paint flicker, both themes legible.
- `/pricing` — both audience tabs, both themes, no unlabeled controls.
- `/login` — light mode legible, no unlabeled controls.
- `/wall` — stays dark in light theme (force-dark confirmed: `--jsconf-bg` = `#080808`).

## Remaining / future work
- Run an automated axe-core pass in CI for ongoing regression coverage.
- Audit focus-visible ring contrast on light backgrounds (currently relies on
  `--ring` = brand yellow, which is low-contrast on white — consider a darker focus ring token for light mode).
- Verify color contrast ratios meet WCAG AA for `--jsconf-muted` text on `--jsconf-surface`
  in light mode (currently `#5C5C5C` on `#F5F5F5` ≈ 5.7:1, passes for normal text).
