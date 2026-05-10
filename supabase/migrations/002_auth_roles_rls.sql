create type if not exists public.mess_role as enum ('OWNER', 'MANAGER', 'MEMBER');

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  username text unique,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table if exists public.mess_members
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists role public.mess_role not null default 'MEMBER',
  add column if not exists mess_id uuid references public.messes(id) on delete cascade,
  add column if not exists opening_balance numeric(12, 2) not null default 0,
  add column if not exists status text not null default 'active';

create unique index if not exists mess_members_mess_user_unique on public.mess_members(mess_id, user_id);

alter table public.profiles enable row level security;
alter table public.messes enable row level security;
alter table public.mess_members enable row level security;
alter table public.months enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_payments enable row level security;
alter table public.monthly_summaries enable row level security;

create or replace function public.is_mess_member(target_mess_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mess_members
    where mess_id = target_mess_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_mess_role(target_mess_id uuid, allowed_roles public.mess_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mess_members
    where mess_id = target_mess_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
      and status = 'active'
  );
$$;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Profiles can be inserted by owner" on public.profiles;
create policy "Profiles can be inserted by owner" on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can read their messes" on public.messes;
create policy "Members can read their messes" on public.messes
  for select to authenticated
  using (public.is_mess_member(id) or created_by = auth.uid());

drop policy if exists "Authenticated users can create mess" on public.messes;
create policy "Authenticated users can create mess" on public.messes
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owners can update mess" on public.messes;
create policy "Owners can update mess" on public.messes
  for update to authenticated
  using (public.has_mess_role(id, array['OWNER']::public.mess_role[]));

drop policy if exists "Mess members can read memberships" on public.mess_members;
create policy "Mess members can read memberships" on public.mess_members
  for select to authenticated
  using (public.is_mess_member(mess_id) or user_id = auth.uid());

drop policy if exists "Users can add own owner membership" on public.mess_members;
create policy "Users can add own owner membership" on public.mess_members
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Owners and managers can update memberships" on public.mess_members;
create policy "Owners and managers can update memberships" on public.mess_members
  for update to authenticated
  using (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]));

drop policy if exists "Members can read months" on public.months;
create policy "Members can read months" on public.months
  for select to authenticated
  using (public.is_mess_member(mess_id));

drop policy if exists "Managers can manage months" on public.months;
create policy "Managers can manage months" on public.months
  for all to authenticated
  using (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]))
  with check (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]));

drop policy if exists "Members can read expenses" on public.expenses;
create policy "Members can read expenses" on public.expenses
  for select to authenticated
  using (public.is_mess_member(mess_id));

drop policy if exists "Members can create expenses" on public.expenses;
create policy "Members can create expenses" on public.expenses
  for insert to authenticated
  with check (public.is_mess_member(mess_id));

drop policy if exists "Managers can update expenses" on public.expenses;
create policy "Managers can update expenses" on public.expenses
  for update to authenticated
  using (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]));

drop policy if exists "Members can read cash payments" on public.cash_payments;
create policy "Members can read cash payments" on public.cash_payments
  for select to authenticated
  using (public.is_mess_member(mess_id));

drop policy if exists "Managers can manage cash payments" on public.cash_payments;
create policy "Managers can manage cash payments" on public.cash_payments
  for all to authenticated
  using (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]))
  with check (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]));

drop policy if exists "Members can read summaries" on public.monthly_summaries;
create policy "Members can read summaries" on public.monthly_summaries
  for select to authenticated
  using (public.is_mess_member(mess_id));
