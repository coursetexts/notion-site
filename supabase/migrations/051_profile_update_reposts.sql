-- name: 051_profile_update_reposts
-- =============================================================================
-- Repost / quote of profile updates (new rows that embed an original)
-- =============================================================================

alter table public.profile_updates
  add column if not exists repost_of_id uuid
    references public.profile_updates(id) on delete set null,
  add column if not exists quote_of_id uuid
    references public.profile_updates(id) on delete set null;

-- At most one of repost_of_id / quote_of_id
alter table public.profile_updates
  drop constraint if exists profile_updates_repost_or_quote;

alter table public.profile_updates
  add constraint profile_updates_repost_or_quote check (
    not (repost_of_id is not null and quote_of_id is not null)
  );

-- Empty body allowed only for pure reposts
alter table public.profile_updates
  drop constraint if exists profile_updates_has_content;

alter table public.profile_updates
  add constraint profile_updates_has_content check (
    repost_of_id is not null
    or char_length(trim(title)) > 0
    or char_length(trim(description)) > 0
  );

create index if not exists idx_profile_updates_repost_of
  on public.profile_updates (repost_of_id)
  where repost_of_id is not null;

create index if not exists idx_profile_updates_quote_of
  on public.profile_updates (quote_of_id)
  where quote_of_id is not null;
