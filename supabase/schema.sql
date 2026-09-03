-- =====================================================================
-- My "Why" Recovery Reflection — Supabase schema
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run; every statement is guarded.
--
-- Access model: ONE shared staff account. Anyone signed in can read and write
-- every record. Anonymous visitors get nothing. There is no per-user
-- attribution — see README "Path to production" before real client data.
-- =====================================================================

-- ---------- Tables ----------

create table if not exists public.asa_events (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null,
  event_date  date,
  staff       text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.asa_outcomes (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null,
  status        text,
  period        text,
  notes         text,
  outcome_date  date,
  created_at    timestamptz not null default now()
);

create index if not exists asa_events_client_id_idx on public.asa_events (lower(client_id));
create index if not exists asa_events_event_date_idx on public.asa_events (event_date);
create index if not exists asa_outcomes_client_id_idx on public.asa_outcomes (lower(client_id));

-- ---------- Row-level security ----------
-- With RLS on and only these policies, the anon key alone reads nothing.

alter table public.asa_events enable row level security;
alter table public.asa_outcomes enable row level security;

drop policy if exists "signed-in staff read events" on public.asa_events;
create policy "signed-in staff read events"
  on public.asa_events for select
  to authenticated
  using (true);

drop policy if exists "signed-in staff write events" on public.asa_events;
create policy "signed-in staff write events"
  on public.asa_events for insert
  to authenticated
  with check (true);

drop policy if exists "signed-in staff delete events" on public.asa_events;
create policy "signed-in staff delete events"
  on public.asa_events for delete
  to authenticated
  using (true);

drop policy if exists "signed-in staff read outcomes" on public.asa_outcomes;
create policy "signed-in staff read outcomes"
  on public.asa_outcomes for select
  to authenticated
  using (true);

drop policy if exists "signed-in staff write outcomes" on public.asa_outcomes;
create policy "signed-in staff write outcomes"
  on public.asa_outcomes for insert
  to authenticated
  with check (true);

drop policy if exists "signed-in staff delete outcomes" on public.asa_outcomes;
create policy "signed-in staff delete outcomes"
  on public.asa_outcomes for delete
  to authenticated
  using (true);

-- No update policy on purpose: records are append-only from the app.
-- Correct a mistake by adding a new event, or edit it in the dashboard.
