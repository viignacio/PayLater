-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Enums
create type trip_role as enum ('CREATOR', 'ADMIN', 'MEMBER');
create type split_type as enum ('EQUAL', 'PERCENTAGE', 'EXACT', 'SHARES', 'TEMPLATE');
create type invite_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- Profiles (linked to auth.users)
create table profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text not null,
  avatar     text,
  qr_code    text,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Trips
create table trips (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text,
  currency    text default 'PHP',
  start_date  timestamptz,
  end_date    timestamptz,
  is_active   boolean default true,
  created_by  uuid references profiles(id) not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trip members
create table trip_members (
  id        uuid default gen_random_uuid() primary key,
  trip_id   uuid references trips(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  role      trip_role default 'MEMBER',
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- Trip invites
create table trip_invites (
  id          uuid default gen_random_uuid() primary key,
  trip_id     uuid references trips(id) on delete cascade not null,
  invited_by  uuid references profiles(id) not null,
  email       text not null,
  role        trip_role default 'MEMBER',
  status      invite_status default 'PENDING',
  token       text unique not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now(),
  unique(trip_id, email)
);

-- Expenses
create table expenses (
  id          uuid default gen_random_uuid() primary key,
  trip_id     uuid references trips(id) on delete cascade not null,
  title       text not null,
  description text,
  amount      numeric not null,
  currency    text default 'PHP',
  date        timestamptz default now(),
  paid_by     uuid references profiles(id) not null,
  split_type  split_type default 'EQUAL',
  is_settled  boolean default false,
  receipt_url text,
  ocr_data    jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Expense splits
create table expense_splits (
  id         uuid default gen_random_uuid() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  amount     numeric not null,
  created_at timestamptz default now(),
  unique(expense_id, user_id)
);

-- Settlements (persisted payment records)
create table settlements (
  id         uuid default gen_random_uuid() primary key,
  trip_id    uuid references trips(id) on delete cascade not null,
  paid_by    uuid references profiles(id) not null,
  paid_to    uuid references profiles(id) not null,
  amount     numeric not null,
  currency   text default 'PHP',
  note       text,
  created_at timestamptz default now()
);

-- ========================
-- Row Level Security
-- ========================

alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table trip_invites enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table settlements enable row level security;

-- PROFILES
create policy "profiles: authenticated read"
  on profiles for select to authenticated using (true);

create policy "profiles: own update"
  on profiles for update to authenticated using (auth.uid() = id);

-- TRIPS
create policy "trips: member read"
  on trips for select to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = trips.id
    and trip_members.user_id = auth.uid()
  ));

create policy "trips: authenticated create"
  on trips for insert to authenticated
  with check (auth.uid() = created_by);

create policy "trips: creator/admin update"
  on trips for update to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = trips.id
    and trip_members.user_id = auth.uid()
    and trip_members.role in ('CREATOR', 'ADMIN')
  ));

create policy "trips: creator/admin delete"
  on trips for delete to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = trips.id
    and trip_members.user_id = auth.uid()
    and trip_members.role in ('CREATOR', 'ADMIN')
  ));

-- TRIP MEMBERS
create policy "trip_members: member read"
  on trip_members for select to authenticated
  using (exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_members.trip_id
    and tm.user_id = auth.uid()
  ));

create policy "trip_members: creator/admin insert"
  on trip_members for insert to authenticated
  with check (
    -- Allow creator to add themselves on trip creation
    user_id = auth.uid()
    or exists (
      select 1 from trip_members tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
      and tm.role in ('CREATOR', 'ADMIN')
    )
  );

create policy "trip_members: creator/admin delete"
  on trip_members for delete to authenticated
  using (exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_members.trip_id
    and tm.user_id = auth.uid()
    and tm.role in ('CREATOR', 'ADMIN')
  ));

-- TRIP INVITES
create policy "trip_invites: creator/admin all"
  on trip_invites for all to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_invites.trip_id
    and trip_members.user_id = auth.uid()
    and trip_members.role in ('CREATOR', 'ADMIN')
  ))
  with check (exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_invites.trip_id
    and trip_members.user_id = auth.uid()
    and trip_members.role in ('CREATOR', 'ADMIN')
  ));

-- EXPENSES
create policy "expenses: member read"
  on expenses for select to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = expenses.trip_id
    and trip_members.user_id = auth.uid()
  ));

create policy "expenses: member create"
  on expenses for insert to authenticated
  with check (exists (
    select 1 from trip_members
    where trip_members.trip_id = expenses.trip_id
    and trip_members.user_id = auth.uid()
  ));

create policy "expenses: creator/payer update"
  on expenses for update to authenticated
  using (
    paid_by = auth.uid()
    or exists (
      select 1 from trip_members
      where trip_members.trip_id = expenses.trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.role in ('CREATOR', 'ADMIN')
    )
  );

create policy "expenses: creator/payer delete"
  on expenses for delete to authenticated
  using (
    paid_by = auth.uid()
    or exists (
      select 1 from trip_members
      where trip_members.trip_id = expenses.trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.role in ('CREATOR', 'ADMIN')
    )
  );

-- EXPENSE SPLITS
create policy "expense_splits: member read"
  on expense_splits for select to authenticated
  using (exists (
    select 1 from expenses
    join trip_members on trip_members.trip_id = expenses.trip_id
    where expenses.id = expense_splits.expense_id
    and trip_members.user_id = auth.uid()
  ));

create policy "expense_splits: member create"
  on expense_splits for insert to authenticated
  with check (exists (
    select 1 from expenses
    join trip_members on trip_members.trip_id = expenses.trip_id
    where expenses.id = expense_splits.expense_id
    and trip_members.user_id = auth.uid()
  ));

create policy "expense_splits: creator/payer modify"
  on expense_splits for all to authenticated
  using (exists (
    select 1 from expenses
    join trip_members on trip_members.trip_id = expenses.trip_id
    where expenses.id = expense_splits.expense_id
    and (
      expenses.paid_by = auth.uid()
      or trip_members.role in ('CREATOR', 'ADMIN')
    )
    and trip_members.user_id = auth.uid()
  ));

-- SETTLEMENTS
create policy "settlements: member read"
  on settlements for select to authenticated
  using (exists (
    select 1 from trip_members
    where trip_members.trip_id = settlements.trip_id
    and trip_members.user_id = auth.uid()
  ));

create policy "settlements: member create"
  on settlements for insert to authenticated
  with check (exists (
    select 1 from trip_members
    where trip_members.trip_id = settlements.trip_id
    and trip_members.user_id = auth.uid()
  ));

create policy "settlements: own delete"
  on settlements for delete to authenticated
  using (paid_by = auth.uid());

-- ========================
-- Storage
-- ========================

insert into storage.buckets (id, name, public)
values ('qr-codes', 'qr-codes', false);

create policy "qr_codes: authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'qr-codes');

create policy "qr_codes: own write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_codes: own update"
  on storage.objects for update to authenticated
  using (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_codes: own delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text);
