-- name: 026_learning_paths_public_research_goal
-- =============================================================================
-- Field Atlas looks up a public research learning path by the question goal.
-- =============================================================================

create index if not exists learning_paths_public_research_goal_idx
  on public.learning_paths (goal, updated_at desc)
  where kind = 'research' and is_private = false;
