-- name: 023_learning_path_kind
-- =============================================================================
-- User-owned paths created from a Field Atlas research question are
-- research learning paths. Everything else stays community (default).
-- =============================================================================

alter table public.learning_paths
  add column if not exists kind text not null default 'community';

alter table public.learning_paths
  drop constraint if exists learning_paths_kind_ck;

alter table public.learning_paths
  add constraint learning_paths_kind_ck
  check (kind in ('community', 'research'));
