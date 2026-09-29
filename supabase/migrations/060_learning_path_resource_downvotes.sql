-- name: 060_learning_path_resource_downvotes
-- =============================================================================
-- Resource cards on a learning path can be upvoted or downvoted.
-- Existing rows were upvotes, so value defaults to 1.
-- =============================================================================

alter table public.learning_path_resource_votes
  add column if not exists value smallint not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learning_path_resource_votes_value_ck'
  ) then
    alter table public.learning_path_resource_votes
      add constraint learning_path_resource_votes_value_ck
      check (value in (1, -1));
  end if;
end $$;

drop policy if exists "Users can update own learning path resource votes"
  on public.learning_path_resource_votes;

create policy "Users can update own learning path resource votes"
  on public.learning_path_resource_votes for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and p.visibility in ('public', 'collaborative')
    )
  );
