-- name: 022_learning_path_privacy
-- =============================================================================
-- User-owned learning paths can be public (shareable) or private (owner only).
-- Catalog rows stay publicly readable.
-- =============================================================================

alter table public.learning_paths
  add column if not exists is_private boolean not null default true;

update public.learning_paths
  set is_private = false
  where is_catalog = true;

drop policy if exists "Anyone can read catalog learning paths"
  on public.learning_paths;
drop policy if exists "Anyone can read public learning paths"
  on public.learning_paths;
create policy "Anyone can read public learning paths"
  on public.learning_paths for select
  using (is_catalog = true or is_private = false);
