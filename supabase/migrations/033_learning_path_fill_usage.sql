-- name: 033_learning_path_fill_usage
-- =============================================================================
-- Daily auto-fill quota for learning-path outlines (15 per signed-in user).
-- =============================================================================

create table if not exists public.learning_path_fill_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  used_on date not null,
  fill_count integer not null default 0 check (fill_count >= 0),
  primary key (user_id, used_on)
);

alter table public.learning_path_fill_usage enable row level security;

drop policy if exists "Users can read own fill usage"
  on public.learning_path_fill_usage;
create policy "Users can read own fill usage"
  on public.learning_path_fill_usage for select
  using (auth.uid() = user_id);

create or replace function public.consume_learning_path_fill(
  max_per_day integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
  next_count integer;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'used', 0, 'remaining', 0);
  end if;

  insert into public.learning_path_fill_usage as usage (user_id, used_on, fill_count)
  values (uid, today, 1)
  on conflict (user_id, used_on)
  do update set fill_count = usage.fill_count + 1
  where usage.fill_count < max_per_day
  returning usage.fill_count into next_count;

  if next_count is null then
    select fill_count into next_count
    from public.learning_path_fill_usage
    where user_id = uid and used_on = today;

    return jsonb_build_object(
      'allowed', false,
      'used', coalesce(next_count, max_per_day),
      'remaining', 0
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', next_count,
    'remaining', greatest(max_per_day - next_count, 0)
  );
end;
$$;

revoke all on function public.consume_learning_path_fill(integer) from public;
grant execute on function public.consume_learning_path_fill(integer) to authenticated;
