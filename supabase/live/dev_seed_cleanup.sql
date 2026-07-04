-- =============================================================================
-- DEV SEED CLEANUP — removes everything created by
-- supabase/live/dev_seed_search.sql from the LIVE community-platform database.
-- Run manually in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Seed users are identified primarily by display_name like 'seed-bot%' (so
-- this also cleans up partial/failed runs), with the fixed uuid list from
-- dev_seed_search.sql included as a belt-and-suspenders fallback in case a
-- profile row was ever renamed.
--
-- NOTE: votes cast by REAL (non-seed) users on seed resources/comments are
-- also deleted here, since those rows target seed data that is going away.
--
-- Deletion order (FK-safe): votes -> comments (replies first, then
-- top-level) -> resources -> knowledge_components -> profiles -> auth.users.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0) Seed user id set, reused by every step below.
-- -----------------------------------------------------------------------------
with seed_users as (
  select id from public.profiles where display_name like 'seed-bot%'
  union
  select unnest(array[
    'a5eedb07-0000-4000-8000-000000000001'::uuid,
    'a5eedb07-0000-4000-8000-000000000002'::uuid,
    'a5eedb07-0000-4000-8000-000000000003'::uuid,
    'a5eedb07-0000-4000-8000-000000000004'::uuid,
    'a5eedb07-0000-4000-8000-000000000005'::uuid,
    'a5eedb07-0000-4000-8000-000000000006'::uuid,
    'a5eedb07-0000-4000-8000-000000000007'::uuid,
    'a5eedb07-0000-4000-8000-000000000008'::uuid,
    'a5eedb07-0000-4000-8000-000000000009'::uuid
  ])
),
seed_resources as (
  select id from public.resources where submitted_by in (select id from seed_users)
),
seed_comments as (
  select id from public.comments
  where user_id in (select id from seed_users)
     or target_id in (select id from seed_resources)
)
-- 1a) Votes cast by seed users (on anything), plus votes (by anyone,
--     including real users) on seed resources or seed comments.
delete from public.votes
where user_id in (select id from seed_users)
   or (target_type::text = 'resource' and target_id in (select id from seed_resources))
   or (target_type::text = 'comment' and target_id in (select id from seed_comments));

-- -----------------------------------------------------------------------------
-- 1b) Comments: delete replies first (parent_comment_id points at a seed
--     comment or at a comment on a seed resource), then the rest of the
--     seed-related comments (top-level, or by seed users, or on seed
--     resources).
-- -----------------------------------------------------------------------------
with seed_users as (
  select id from public.profiles where display_name like 'seed-bot%'
  union
  select unnest(array[
    'a5eedb07-0000-4000-8000-000000000001'::uuid,
    'a5eedb07-0000-4000-8000-000000000002'::uuid,
    'a5eedb07-0000-4000-8000-000000000003'::uuid,
    'a5eedb07-0000-4000-8000-000000000004'::uuid,
    'a5eedb07-0000-4000-8000-000000000005'::uuid,
    'a5eedb07-0000-4000-8000-000000000006'::uuid,
    'a5eedb07-0000-4000-8000-000000000007'::uuid,
    'a5eedb07-0000-4000-8000-000000000008'::uuid,
    'a5eedb07-0000-4000-8000-000000000009'::uuid
  ])
),
seed_resources as (
  select id from public.resources where submitted_by in (select id from seed_users)
),
seed_comment_ids as (
  select id from public.comments
  where user_id in (select id from seed_users)
     or target_id in (select id from seed_resources)
)
delete from public.comments
where parent_comment_id in (select id from seed_comment_ids);

with seed_users as (
  select id from public.profiles where display_name like 'seed-bot%'
  union
  select unnest(array[
    'a5eedb07-0000-4000-8000-000000000001'::uuid,
    'a5eedb07-0000-4000-8000-000000000002'::uuid,
    'a5eedb07-0000-4000-8000-000000000003'::uuid,
    'a5eedb07-0000-4000-8000-000000000004'::uuid,
    'a5eedb07-0000-4000-8000-000000000005'::uuid,
    'a5eedb07-0000-4000-8000-000000000006'::uuid,
    'a5eedb07-0000-4000-8000-000000000007'::uuid,
    'a5eedb07-0000-4000-8000-000000000008'::uuid,
    'a5eedb07-0000-4000-8000-000000000009'::uuid
  ])
),
seed_resources as (
  select id from public.resources where submitted_by in (select id from seed_users)
)
delete from public.comments
where user_id in (select id from seed_users)
   or target_id in (select id from seed_resources);

-- -----------------------------------------------------------------------------
-- 2) Resources submitted by seed users.
-- -----------------------------------------------------------------------------
with seed_users as (
  select id from public.profiles where display_name like 'seed-bot%'
  union
  select unnest(array[
    'a5eedb07-0000-4000-8000-000000000001'::uuid,
    'a5eedb07-0000-4000-8000-000000000002'::uuid,
    'a5eedb07-0000-4000-8000-000000000003'::uuid,
    'a5eedb07-0000-4000-8000-000000000004'::uuid,
    'a5eedb07-0000-4000-8000-000000000005'::uuid,
    'a5eedb07-0000-4000-8000-000000000006'::uuid,
    'a5eedb07-0000-4000-8000-000000000007'::uuid,
    'a5eedb07-0000-4000-8000-000000000008'::uuid,
    'a5eedb07-0000-4000-8000-000000000009'::uuid
  ])
)
delete from public.resources
where submitted_by in (select id from seed_users);

-- -----------------------------------------------------------------------------
-- 3) Knowledge components created by seed users.
-- -----------------------------------------------------------------------------
with seed_users as (
  select id from public.profiles where display_name like 'seed-bot%'
  union
  select unnest(array[
    'a5eedb07-0000-4000-8000-000000000001'::uuid,
    'a5eedb07-0000-4000-8000-000000000002'::uuid,
    'a5eedb07-0000-4000-8000-000000000003'::uuid,
    'a5eedb07-0000-4000-8000-000000000004'::uuid,
    'a5eedb07-0000-4000-8000-000000000005'::uuid,
    'a5eedb07-0000-4000-8000-000000000006'::uuid,
    'a5eedb07-0000-4000-8000-000000000007'::uuid,
    'a5eedb07-0000-4000-8000-000000000008'::uuid,
    'a5eedb07-0000-4000-8000-000000000009'::uuid
  ])
)
delete from public.knowledge_components
where created_by in (select id from seed_users);

-- -----------------------------------------------------------------------------
-- 4) Profiles.
-- -----------------------------------------------------------------------------
delete from public.profiles
where display_name like 'seed-bot%'
   or id in (
     'a5eedb07-0000-4000-8000-000000000001',
     'a5eedb07-0000-4000-8000-000000000002',
     'a5eedb07-0000-4000-8000-000000000003',
     'a5eedb07-0000-4000-8000-000000000004',
     'a5eedb07-0000-4000-8000-000000000005',
     'a5eedb07-0000-4000-8000-000000000006',
     'a5eedb07-0000-4000-8000-000000000007',
     'a5eedb07-0000-4000-8000-000000000008',
     'a5eedb07-0000-4000-8000-000000000009'
   );

-- -----------------------------------------------------------------------------
-- 5) auth.users.
-- -----------------------------------------------------------------------------
delete from auth.users
where id in (
  'a5eedb07-0000-4000-8000-000000000001',
  'a5eedb07-0000-4000-8000-000000000002',
  'a5eedb07-0000-4000-8000-000000000003',
  'a5eedb07-0000-4000-8000-000000000004',
  'a5eedb07-0000-4000-8000-000000000005',
  'a5eedb07-0000-4000-8000-000000000006',
  'a5eedb07-0000-4000-8000-000000000007',
  'a5eedb07-0000-4000-8000-000000000008',
  'a5eedb07-0000-4000-8000-000000000009'
);

-- -----------------------------------------------------------------------------
-- 6) Verification — every count below should be 0.
-- -----------------------------------------------------------------------------
select
  (select count(*) from public.profiles where display_name like 'seed-bot%') as remaining_profiles,
  (select count(*) from auth.users where id in (
    'a5eedb07-0000-4000-8000-000000000001','a5eedb07-0000-4000-8000-000000000002',
    'a5eedb07-0000-4000-8000-000000000003','a5eedb07-0000-4000-8000-000000000004',
    'a5eedb07-0000-4000-8000-000000000005','a5eedb07-0000-4000-8000-000000000006',
    'a5eedb07-0000-4000-8000-000000000007','a5eedb07-0000-4000-8000-000000000008',
    'a5eedb07-0000-4000-8000-000000000009'
  )) as remaining_auth_users,
  (select count(*) from public.resources where submitted_by in (
    'a5eedb07-0000-4000-8000-000000000001','a5eedb07-0000-4000-8000-000000000002',
    'a5eedb07-0000-4000-8000-000000000003','a5eedb07-0000-4000-8000-000000000004',
    'a5eedb07-0000-4000-8000-000000000005','a5eedb07-0000-4000-8000-000000000006',
    'a5eedb07-0000-4000-8000-000000000007','a5eedb07-0000-4000-8000-000000000008',
    'a5eedb07-0000-4000-8000-000000000009'
  )) as remaining_resources,
  (select count(*) from public.knowledge_components where created_by in (
    'a5eedb07-0000-4000-8000-000000000001','a5eedb07-0000-4000-8000-000000000002',
    'a5eedb07-0000-4000-8000-000000000003','a5eedb07-0000-4000-8000-000000000004',
    'a5eedb07-0000-4000-8000-000000000005','a5eedb07-0000-4000-8000-000000000006',
    'a5eedb07-0000-4000-8000-000000000007','a5eedb07-0000-4000-8000-000000000008',
    'a5eedb07-0000-4000-8000-000000000009'
  )) as remaining_knowledge_components;

commit;
