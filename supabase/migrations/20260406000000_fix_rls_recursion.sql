-- Fix RLS recursion in trip_members by adding user_id = auth.uid() as a base case
drop policy if exists "trip_members: member read" on trip_members;
create policy "trip_members: member read"
  on trip_members for select to authenticated
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from trip_members tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
    )
  );

-- Fix trip visibility during creation by allowing creators to see their own trips
drop policy if exists "trips: member read" on trips;
create policy "trips: member read"
  on trips for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from trip_members
      where trip_members.trip_id = trips.id
      and trip_members.user_id = auth.uid()
    )
  );

-- Ensure other membership-based checks are robust
drop policy if exists "expenses: member read" on expenses;
create policy "expenses: member read"
  on expenses for select to authenticated
  using (
    paid_by = auth.uid()
    or exists (
      select 1 from trip_members
      where trip_members.trip_id = expenses.trip_id
      and trip_members.user_id = auth.uid()
    )
  );
