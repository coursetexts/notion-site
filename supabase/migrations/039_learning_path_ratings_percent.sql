-- name: 039_learning_path_ratings_percent
-- =============================================================================
-- Existing DBs that already ran 038 with 1–5 stars: widen rating to 0–100.
-- Safe to run after the updated 038 as well.
-- =============================================================================

alter table public.learning_path_ratings
  drop constraint if exists learning_path_ratings_rating_ck;

alter table public.learning_path_ratings
  add constraint learning_path_ratings_rating_ck
  check (rating >= 0 and rating <= 100);
