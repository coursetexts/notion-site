-- name: 047_revert_official_course_content
-- =============================================================================
-- Reverts 046_official_course_content (Supabase /db-course mirror).
-- Run this if you already applied 046.
-- =============================================================================

drop index if exists public.courses_official_synced_idx;
drop index if exists public.courses_canonical_slug_official_idx;

alter table public.courses
  drop column if exists record_map,
  drop column if exists canonical_slug,
  drop column if exists title,
  drop column if exists meta,
  drop column if exists description,
  drop column if exists subjects,
  drop column if exists is_official,
  drop column if exists synced_at,
  drop column if exists notion_last_edited;
