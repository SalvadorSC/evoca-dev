-- 006_slot_speaker_email.sql
-- Phase 2 — Speaker assignment
-- Tracks the invited speaker's email on a slot so pending invites (speakers
-- without an account yet) can be displayed and linked when they sign up.
-- speaker_id remains the FK to the speaker's auth user once accepted.

alter table public.conference_slots add column if not exists speaker_email text;
