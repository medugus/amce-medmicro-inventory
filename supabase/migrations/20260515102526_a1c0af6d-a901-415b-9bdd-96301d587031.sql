
-- Shared cloud tables for AMCE Microbiology inventory.
-- Each table stores one record per row, keyed by the existing string ID,
-- with the full domain object preserved verbatim in `data` (JSONB).
-- This keeps the existing TypeScript types and pages working unchanged.

create table if not exists public.inventory_items (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.batches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.supply_status (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.acceptance_tests (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.durables (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.forecasts (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_requests (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_trail (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gtin_catalogue (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.scan_history (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable RLS on every table, with open read+write policies.
-- This is intentional: no login, shared lab use, closed network.
do $$
declare
  t text;
  tables text[] := array[
    'inventory_items','batches','supply_status','stock_movements',
    'acceptance_tests','equipment','durables','forecasts',
    'purchase_requests','audit_trail','gtin_catalogue','scan_history'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "open read" on public.%I', t);
    execute format('drop policy if exists "open insert" on public.%I', t);
    execute format('drop policy if exists "open update" on public.%I', t);
    execute format('drop policy if exists "open delete" on public.%I', t);
    execute format('create policy "open read" on public.%I for select using (true)', t);
    execute format('create policy "open insert" on public.%I for insert with check (true)', t);
    execute format('create policy "open update" on public.%I for update using (true) with check (true)', t);
    execute format('create policy "open delete" on public.%I for delete using (true)', t);
    -- Realtime: full row payload on changes.
    execute format('alter table public.%I replica identity full', t);
    -- Add to realtime publication (idempotent).
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;

-- Auto-bump updated_at on writes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'inventory_items','batches','supply_status','stock_movements',
    'acceptance_tests','equipment','durables','forecasts',
    'purchase_requests','audit_trail','gtin_catalogue','scan_history'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format('create trigger trg_set_updated_at before insert or update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
