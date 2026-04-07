create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_company text not null,
  client_email text not null,
  title text not null,
  summary text not null default '',
  status text not null default 'Awaiting approval',
  valid_until date,
  timeline text not null default 'TBC',
  notes text not null default '',
  contact_email text not null default 'hello@noventisdigital.co.uk',
  scope text[] not null default '{}',
  line_items jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_quotes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;

create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_quotes_updated_at();

alter table public.quotes enable row level security;

drop policy if exists "Clients can view own quotes" on public.quotes;

create policy "Clients can view own quotes"
on public.quotes
for select
using (auth.uid() = auth_user_id);

drop policy if exists "Service role can manage quotes" on public.quotes;

create policy "Service role can manage quotes"
on public.quotes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

comment on table public.quotes is 'Client-facing quote records surfaced in the Noventis Digital portal.';

-- Example insert pattern:
-- insert into public.quotes (
--   auth_user_id,
--   client_name,
--   client_company,
--   client_email,
--   title,
--   summary,
--   status,
--   valid_until,
--   timeline,
--   notes,
--   contact_email,
--   scope,
--   line_items,
--   milestones,
--   total_amount
-- ) values (
--   '00000000-0000-0000-0000-000000000000',
--   'Jane Client',
--   'Client Company',
--   'jane@clientcompany.com',
--   'AI systems audit',
--   'A concise summary of the engagement.',
--   'Awaiting approval',
--   '2026-04-30',
--   '3 weeks',
--   'Includes one review round.',
--   'hello@noventisdigital.co.uk',
--   array['Workflow review', 'Prototype delivery', 'Implementation notes'],
--   '[
--     {"name":"Discovery","description":"Current-state review","amount":1200},
--     {"name":"Prototype","description":"Working automation flow","amount":2400}
--   ]'::jsonb,
--   '[
--     {"label":"Discovery complete","due":"2026-04-12","status":"done"},
--     {"label":"Prototype review","due":"2026-04-19","status":"current"},
--     {"label":"Handover","due":"2026-04-26","status":"next"}
--   ]'::jsonb,
--   3600
-- );
