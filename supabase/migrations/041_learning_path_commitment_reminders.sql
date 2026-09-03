-- name: 041_learning_path_commitment_reminders
-- =============================================================================
-- Per-user committed flags + optional finish reminders on Learning tab items.
-- Standalone: creates `learning_path_commitments` if 030 was never applied.
-- Reminder columns are nullable — commit without a reminder is allowed.
-- A reminder can only live on a commitment row (no reminder without committing).
-- Cadence + local time are stored here; sending notifications is not built yet.
-- target_key is `learning-path:{slug}` or `course:{notion_page_id}`.
-- =============================================================================

create table if not exists public.learning_path_commitments (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_key text not null,
  created_at timestamptz not null default now(),
  reminder_frequency text,
  reminder_minute smallint,
  reminder_timezone text,
  primary key (user_id, target_key)
);

alter table public.learning_path_commitments
  add column if not exists reminder_frequency text,
  add column if not exists reminder_minute smallint,
  add column if not exists reminder_timezone text;

create index if not exists learning_path_commitments_user_idx
  on public.learning_path_commitments (user_id, created_at desc);

alter table public.learning_path_commitments enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learning_path_commitments_reminder_frequency_check'
  ) then
    alter table public.learning_path_commitments
      add constraint learning_path_commitments_reminder_frequency_check
      check (
        reminder_frequency is null
        or reminder_frequency in (
          'daily',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learning_path_commitments_reminder_minute_check'
  ) then
    alter table public.learning_path_commitments
      add constraint learning_path_commitments_reminder_minute_check
      check (
        reminder_minute is null
        or (reminder_minute >= 0 and reminder_minute < 1440)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learning_path_commitments_reminder_pair_check'
  ) then
    alter table public.learning_path_commitments
      add constraint learning_path_commitments_reminder_pair_check
      check (
        (
          reminder_frequency is null
          and reminder_minute is null
          and reminder_timezone is null
        )
        or (
          reminder_frequency is not null
          and reminder_minute is not null
          and reminder_timezone is not null
        )
      );
  end if;
end
$$;

drop policy if exists "Users can read own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can read own learning path commitments"
  on public.learning_path_commitments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can insert own learning path commitments"
  on public.learning_path_commitments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can delete own learning path commitments"
  on public.learning_path_commitments for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update own learning path commitments"
  on public.learning_path_commitments;
create policy "Users can update own learning path commitments"
  on public.learning_path_commitments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
