-- Create tables for Monopoly Clone

-- 1. Rooms Table
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null check (status in ('LOBBY', 'PLAYING', 'ENDED')),
  game_state jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 2. Players Table
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  avatar_id text,
  is_host boolean default false,
  joined_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table rooms enable row level security;
alter table players enable row level security;

-- Policies (Simple public access for MVP, refine for security later)
create policy "Public rooms are viewable by everyone"
  on rooms for select
  using (true);

create policy "Anyone can create a room"
  on rooms for insert
  with check (true);

create policy "Anyone can update a room"
  on rooms for update
  using (true);

create policy "Public players are viewable by everyone"
  on players for select
  using (true);

create policy "Anyone can join a room"
  on players for insert
  with check (true);

-- Enable Realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
