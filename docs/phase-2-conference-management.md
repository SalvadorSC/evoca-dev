# Phase 2 — Conference Management Core

> Status: **Pending**
> Blocker: Phase 1 must be complete (access gating, affiliation system)

---

## Goal

Give organizers the tools to build a full conference program: multiple days, typed slots, and speaker assignment. Speaker assignment is the entry point for the affiliation system (speaker gets temporary Pro access for the event).

---

## Features in this phase

| Feature | Status |
|---|---|
| Conference multi-day scheduling (up to 5 days) | Pending |
| Conference slot management | Pending |
| Speaker assignment to conference slots | Pending |

---

## 2.1 Multi-day Scheduling
Files: `app/dashboard/conference/[id]/schedule/page.tsx`, `components/conference/DayTimeline.tsx`

### Data model
A conference is attached to an `organizer_subscriptions` row. It needs:
```sql
-- Add to organizer_subscriptions or create conferences table
name          text not null,
days          jsonb not null default '[]'
-- Each day: { id, label, date, slots: [] }
```

### UI
- Organizer sees a tab per day (up to 5 tabs: "Day 1", "Day 2", etc. — can be renamed)
- Each tab shows a vertical timeline for that day
- Day dates must fall within the event window (`event_start` to `event_end`)
- "Add day" button (disabled when at 5)

### Access gating
- Creating/editing the schedule structure: available pre-event (org plan required)
- Running live sessions: only during active event window

---

## 2.2 Slot Management
Files: `components/conference/SlotCard.tsx`, `components/conference/AddSlotDialog.tsx`

### Slot types
| Type | Color code | Notes |
|---|---|---|
| Talk | — | Assignable to a speaker |
| Keynote | — | Assignable to a speaker, featured styling |
| Workshop | — | Assignable to a speaker |
| Lightning Talk | — | Short format, assignable to a speaker |
| Break | — | No speaker, just a time block |
| Panel | — | Multiple speakers |

### Slot fields
- `title` (required)
- `type` (required, from list above)
- `start_time` (time within the day)
- `duration` (in minutes)
- `description` (optional)
- `speaker_id` (nullable — assigned via feat-008)
- `location` / `track` (optional — for multi-track conferences)

### UI interactions
- Click empty timeline area → "Add slot" dialog pre-filled with that time
- Drag slot to move (time changes)
- Drag slot edge to resize (duration changes)
- Click slot → edit dialog

---

## 2.3 Speaker Assignment
Files: `components/conference/AssignSpeakerDialog.tsx`, `app/api/conference/assign-speaker/route.ts`

### Flow
1. Organizer opens a slot → clicks "Assign Speaker"
2. Types an email address
3. **Email matches existing account:**
   - User is linked to the slot immediately
   - Row inserted into `event_speaker_affiliations` with `status: 'accepted'`
   - Speaker gets Pro access for the event window
4. **Email does not match any account:**
   - Invitation email sent (template TBD)
   - Row inserted into `event_speaker_affiliations` with `status: 'pending'`
   - On signup: if email matches a pending affiliation → auto-accept and link

### Affiliation effect
- On affiliation row with `status: 'accepted'`:
  - Speaker's account gains Pro features scoped to this event
  - Access evaluated at runtime: `event_start <= now() <= event_end`
  - No changes to `speaker_plan` on the speakers row — purely event-scoped

### Edge cases
- Speaker is already affiliated to the event → show existing status, do not duplicate
- Organizer removes a speaker from a slot → set affiliation `status: 'revoked'`, access removed
- Speaker declines invitation → `status: 'declined'`, slot goes back to unassigned

---

## Definition of Done

- [ ] Organizer can create a conference with 1–5 named days
- [ ] Each day shows a timeline with add/edit/move/resize for slots
- [ ] All slot types render with correct styling
- [ ] Organizer can assign a speaker by email to any slot
- [ ] Existing users: affiliation created immediately, Pro access active during event window
- [ ] New users: invitation email sent, affiliation linked on signup
- [ ] Removing a speaker from a slot revokes affiliation
- [ ] Schedule editing is blocked (PaywallModal) for users without an organizer plan
- [ ] `features.json` feat-006, feat-007, feat-008 marked complete
