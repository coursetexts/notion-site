-- name: 024_course_notes_topic
-- =============================================================================
-- Course notes are per topic/tab, not one document for the whole course.
-- Existing rows keep topic_id = '' and are used as a read fallback.
-- =============================================================================

alter table public.course_notes
  add column if not exists topic_id text not null default '';

alter table public.course_notes
  drop constraint if exists course_notes_topic_id_len;
alter table public.course_notes
  add constraint course_notes_topic_id_len
  check (char_length(topic_id) <= 200);

alter table public.course_notes
  drop constraint if exists course_notes_user_id_course_id_key;
alter table public.course_notes
  drop constraint if exists course_notes_user_id_course_id_topic_id_key;
alter table public.course_notes
  drop constraint if exists course_notes_user_course_topic_key;
alter table public.course_notes
  add constraint course_notes_user_course_topic_key
  unique (user_id, course_id, topic_id);
