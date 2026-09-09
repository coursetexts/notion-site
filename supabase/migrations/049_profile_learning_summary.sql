-- name: 049_profile_learning_summary
-- =============================================================================
-- Public profile bio + learning summary (below bio on /profile/[userId])
-- =============================================================================

alter table public.profiles
  add column if not exists bio text,
  add column if not exists learning_now text,
  add column if not exists learning_learned text;

alter table public.profiles
  drop constraint if exists profiles_bio_len;

alter table public.profiles
  add constraint profiles_bio_len
  check (bio is null or char_length(bio) <= 500);

alter table public.profiles
  drop constraint if exists profiles_learning_now_len;

alter table public.profiles
  add constraint profiles_learning_now_len
  check (learning_now is null or char_length(learning_now) <= 500);

alter table public.profiles
  drop constraint if exists profiles_learning_learned_len;

alter table public.profiles
  add constraint profiles_learning_learned_len
  check (learning_learned is null or char_length(learning_learned) <= 500);
