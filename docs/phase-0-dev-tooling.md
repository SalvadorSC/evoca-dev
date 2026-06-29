# Phase 0 — Dev Tooling

> Status: **Complete**
> Blocking: Nothing. Can be improved at any time.

---

## Goal

A lightweight developer overlay visible only in `NODE_ENV=development` to track features, phases, and ideas without leaving the app.

---

## Features in this phase

| Feature | Status |
|---|---|
| Dev floating overlay — features & ideas tracker | Done |

---

## What was built

### Dev Overlay (`components/dev/DevOverlay.tsx`)
- Draggable floating panel, visible only in development
- Reads from `features.json` (phases, subtasks, status) and `ideas.json`
- Groups features by phase with collapsible phase headers
- Shows overall progress bar (X/Y done) at the top
- Each feature row shows: name, priority dot, complexity chip, subtask counter
- IDs (`feat-010`) are never shown — names only
- No effect on production UI

---

## Data files

| File | Purpose |
|---|---|
| `features.json` | All features with phase, status, subtasks, priority, complexity |
| `ideas.json` | Backlog ideas not yet scheduled into a phase |

---

## Rules for keeping this up to date

- When a feature is completed, set `"complete": true` and `"status": "done"` in `features.json`
- When a subtask is completed, set its `"complete": true`
- When a new feature is defined, add it with the correct `phase` and initial `status: "pending"`
- The overlay reads the JSON at runtime — no rebuild needed for status updates
