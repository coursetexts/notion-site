-- name: 054_learning_path_invites_readable_on_path
-- =============================================================================
-- Anyone who can read a learning path can list its invites (people sidebar).
-- Does not change insert/delete (owner-only). Emails stay on the row; the app
-- shows display names when available.
-- =============================================================================

drop policy if exists "Path readers can list invites"
  on public.learning_path_invites;
create policy "Path readers can list invites"
  on public.learning_path_invites for select
  using (
    exists (
      select 1
      from public.learning_paths p
      where p.id = path_id
        and (
          p.is_catalog = true
          or p.visibility in ('public', 'collaborative')
          or (auth.uid() is not null and p.owner_id = auth.uid())
          or (auth.uid() is not null and public.is_learning_path_invitee(p.id))
        )
    )
  );
