# Phase 6 — Polish & Responsive

> Status: **Pending**
> Blocker: None. Can be worked on in parallel with any other phase.
> **Next:** Once this phase is complete, prepare for **Phase 7 — Call for Papers**
> (`docs/phase-7-call-for-papers.md`). Resolve its open questions and lock scope
> before starting; note that Phase 7 notifications likely require wiring the
> transactional email provider that Phase 2 left stubbed.

---

## Goal

Ensure the app looks and works correctly at every viewport, has a proper visual identity (favicon, theme), and light mode is available for users who prefer it.

---

## Features in this phase

| Feature | Status |
|---|---|
| Full responsive layout — homepage | Pending |
| Full responsive layout — global | Pending |
| Color mode (theme switcher) | Pending |
| Favicon — SVG with 'e' in Evoca colors | Pending |

---

## 6.1 Homepage Responsive Fix
File: `app/page.tsx` and its child components

### Scope
- Fix layout overflow, wrapping, and scaling issues on mobile (320px–768px) and tablet (768px–1024px)
- Pricing cards: must stack vertically on mobile
- Hero section: text must not overflow or clip
- Navigation: must collapse to a hamburger or simplified layout on mobile

### Test breakpoints
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (iPad Pro / small laptop)
- 1440px (standard desktop)

---

## 6.2 Global Responsive Audit
Files: all pages under `app/`

### Process
1. Walk every route in the app
2. Test at each breakpoint from 6.1
3. Fix any overflow, unreadable text, overlapping elements, or broken layouts

### Known candidates (at time of writing)
- Dashboard sidebar: likely needs to collapse on mobile
- Session/presenter view: slide area must scale correctly
- Q&A panel: must be scrollable and not overflow on small screens
- Talk editor: form layout on mobile

---

## 6.3 Theme Switcher (Light / Dark)
Files: `components/ThemeToggle.tsx`, `app/layout.tsx`, `app/globals.css`

### Implementation
- Use `next-themes` for SSR-safe theme management
- `<ThemeToggle>` button in the navigation/header
- Persist preference in `localStorage` (client-only, no DB needed)
- System preference respected by default (`prefers-color-scheme`)

### Design tokens
- Define light mode CSS variables alongside existing dark mode vars in `globals.css`
- Every color in the app must reference a CSS variable — no hardcoded colors

### Surfaces to validate
- Landing page
- Dashboard (sidebar, cards, forms)
- Session viewer (presenter + audience)
- Account page
- Dev overlay (can stay dark-only)

---

## 6.4 Favicon
Files: `app/favicon.ico`, `public/favicon.svg`

### Design
- Letter **"e"** in Evoca brand typeface/style
- Colors: Evoca brand palette (to be confirmed against current `globals.css`)
- SVG format as primary (modern browsers)
- `.ico` fallback (32x32) for legacy browsers

### Implementation
- Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` in `app/layout.tsx`
- Add `<link rel="alternate icon" href="/favicon.ico">` as fallback
- Add apple-touch-icon (180x180 PNG) for iOS home screen

---

## Definition of Done

- [ ] Homepage renders without overflow or broken layout at all 5 breakpoints
- [ ] All app routes pass visual review at mobile, tablet, and desktop
- [ ] Dashboard sidebar collapses correctly on mobile
- [ ] Light mode looks correct on all surfaces
- [ ] Theme toggle persists preference across sessions
- [ ] Favicon appears correctly in browser tab (SVG), bookmarks, and iOS home screen
- [ ] `features.json` feat-002, feat-003, feat-011, feat-012 marked complete
