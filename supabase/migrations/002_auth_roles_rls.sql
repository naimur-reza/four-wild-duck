do $$ begin
  create type public.mess_role as enum ('OWNER', 'MANAGER', 'MEMBER');
exception when duplicate_object then null;
end $$;

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
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mess_members where mess_id = target_mess_id and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.has_mess_role(target_mess_id uuid, allowed_roles public.mess_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mess_members where mess_id = target_mess_id and user_id = auth.uid() and role = any(allowed_roles) and status = 'active');
$$;

drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own" on public.profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own" on public.profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Messes select members" on public.messes;
create policy "Messes select members" on public.messes for select to authenticated using (public.is_mess_member(id) or created_by = auth.uid());
drop policy if exists "Messes insert creator" on public.messes;
create policy "Messes insert creator" on public.messes for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "Messes update owners" on public.messes;
create policy "Messes update owners" on public.messes for update to authenticated using (public.has_mess_role(id, array['OWNER']::public.mess_role[]));

drop policy if exists "Membership select members" on public.mess_members;
create policy "Membership select members" on public.mess_members for select to authenticated using (public.is_mess_member(mess_id) or user_id = auth.uid());
drop policy if exists "Membership insert self" on public.mess_members;
create policy "Membership insert self" on public.mess_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Membership update managers" on public.mess_members;
create policy "Membership update managers" on public.mess_members for update to authenticated using (public.has_mess_role(mess_id, array['OWNER','MANAGER']::public.mess_role[]));
