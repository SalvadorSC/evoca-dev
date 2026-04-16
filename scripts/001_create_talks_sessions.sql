-- Create talks table
create table if not exists public.talks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  slug text not null unique,
  slide_url text,
  slide_type text, -- 'pptx', 'pdf', 'slides_com', null
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  talk_id uuid not null references public.talks(id) on delete cascade,
  partykit_room text not null unique,
  started_at timestamptz default now(),
  ended_at timestamptz,
  question_count integer default 0,
  reaction_count integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.talks enable row level security;
alter table public.sessions enable row level security;

-- Talks policies
create policy "talks_select_own" on public.talks 
  for select using (auth.uid() = user_id);

create policy "talks_insert_own" on public.talks 
  for insert with check (auth.uid() = user_id);

create policy "talks_update_own" on public.talks 
  for update using (auth.uid() = user_id);

create policy "talks_delete_own" on public.talks 
  for delete using (auth.uid() = user_id);

-- Sessions policies
create policy "sessions_select_own" on public.sessions 
  for select using (
    exists (
      select 1 from public.talks 
      where talks.id = sessions.talk_id 
      and talks.user_id = auth.uid()
    )
  );

create policy "sessions_insert_own" on public.sessions 
  for insert with check (
    exists (
      select 1 from public.talks 
      where talks.id = sessions.talk_id 
      and talks.user_id = auth.uid()
    )
  );

create policy "sessions_update_own" on public.sessions 
  for update using (
    exists (
      select 1 from public.talks 
      where talks.id = sessions.talk_id 
      and talks.user_id = auth.uid()
    )
  );

create policy "sessions_delete_own" on public.sessions 
  for delete using (
    exists (
      select 1 from public.talks 
      where talks.id = sessions.talk_id 
      and talks.user_id = auth.uid()
    )
  );

-- Create indexes
create index if not exists talks_user_id_idx on public.talks(user_id);
create index if not exists talks_slug_idx on public.talks(slug);
create index if not exists sessions_talk_id_idx on public.sessions(talk_id);
create index if not exists sessions_partykit_room_idx on public.sessions(partykit_room);
