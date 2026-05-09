create extension if not exists "pgcrypto";

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  opening_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.months (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  member_count int not null default 4,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  month_id uuid references public.months(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.cash_payments (
  id uuid primary key default gen_random_uuid(),
  month_id uuid references public.months(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  month_id uuid references public.months(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  previous_balance numeric(12, 2) not null default 0,
  monthly_share numeric(12, 2) not null default 0,
  expense_paid numeric(12, 2) not null default 0,
  cash_paid numeric(12, 2) not null default 0,
  total_contribution numeric(12, 2) not null default 0,
  closing_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique(month_id, member_id)
);
