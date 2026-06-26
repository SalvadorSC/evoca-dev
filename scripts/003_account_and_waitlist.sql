-- Add username column to speakers table
alter table public.speakers
  add column if not exists username text unique;

-- Create index for fast username lookups
create index if not exists speakers_username_idx on public.speakers(username);

-- Pro waitlist table
create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

alter table public.pro_waitlist enable row level security;

-- Anyone can insert their email (anonymous sign-up)
create policy "waitlist_insert_anon" on public.pro_waitlist
  for insert with check (true);

-- Only service role can read (no user-facing select needed)
create policy "waitlist_select_service" on public.pro_waitlist
  for select using (false);
