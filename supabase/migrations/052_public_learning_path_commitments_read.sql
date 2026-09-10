-- name: 052_public_learning_path_commitments_read
-- =============================================================================
-- Allow reading another user's committed Learning targets (for public profiles).
-- Writes stay owner-only.
-- =============================================================================

drop policy if exists "Users can read own learning path commitments"
  on public.learning_path_commitments;

drop policy if exists "Anyone can read learning path commitments"
  on public.learning_path_commitments;

create policy "Anyone can read learning path commitments"
  on public.learning_path_commitments for select
  using (true);
