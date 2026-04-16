-- Create questions table for storing attendee Q&A per session.
-- Questions from the /demo route are never written here — only real sessions.

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  text        text not null,
  name        text not null default 'Anonymous',
  votes       integer not null default 0,
  answered    boolean not null default false,
  party_id    text,          -- the ephemeral ID from PartyKit (for dedup / updates)
  created_at  timestamptz not null default now()
);

-- Index for fast lookup by session
create index if not exists questions_session_id_idx on public.questions(session_id);

-- RLS
alter table public.questions enable row level security;

-- Speakers (authenticated users) can read questions for sessions that belong to their talks
create policy "speakers_read_own_session_questions"
  on public.questions for select
  using (
    exists (
      select 1
      from public.sessions s
      join public.talks t on t.id = s.talk_id
      where s.id = questions.session_id
        and t.user_id = auth.uid()
    )
  );

-- Anyone can insert a question (attendees are anonymous)
create policy "anyone_insert_question"
  on public.questions for insert
  with check (true);

-- Anyone can increment votes (upsert by party_id, only votes column)
create policy "anyone_update_votes"
  on public.questions for update
  using (true)
  with check (true);
