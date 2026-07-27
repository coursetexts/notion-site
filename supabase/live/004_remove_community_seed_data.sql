-- =============================================================================
-- One-time production cleanup for the community demo data and test accounts.
-- Review the preview query below before executing the transaction.
-- =============================================================================

-- Preview: these are the only auth users and profiles this cleanup targets.
select id, email
from auth.users
where email in (
  'e2e-maya@coursetexts.dev',
  'e2e-devran@coursetexts.dev',
  'e2e-lena@coursetexts.dev'
)
or email like 'seed-bot+%@example.com'
or id::text like 'a5eedb07-0000-4000-8000-00000000000_'
order by email;

select id, email, display_name
from public.profiles
where email in (
  'e2e-maya@coursetexts.dev',
  'e2e-devran@coursetexts.dev',
  'e2e-lena@coursetexts.dev'
)
or email like 'seed-bot+%@example.com'
or id::text like 'a5eedb07-0000-4000-8000-00000000000_'
order by email;

begin;

create temporary table community_seed_users on commit drop as
select id
from auth.users
where email in (
  'e2e-maya@coursetexts.dev',
  'e2e-devran@coursetexts.dev',
  'e2e-lena@coursetexts.dev'
)
or email like 'seed-bot+%@example.com';

-- Some bulk seed profiles were inserted directly and have no auth.users row.
create temporary table community_seed_profiles on commit drop as
select id
from public.profiles
where email in (
  'e2e-maya@coursetexts.dev',
  'e2e-devran@coursetexts.dev',
  'e2e-lena@coursetexts.dev'
)
or email like 'seed-bot+%@example.com'
or id::text like 'a5eedb07-0000-4000-8000-00000000000_'
union
select id from community_seed_users;

create temporary table community_seed_resources on commit drop as
select id
from public.resources
where submitted_by in (select id from community_seed_profiles)
   or url like 'https://example.edu/seed/%';

create temporary table community_seed_comments on commit drop as
with recursive seed_comments as (
  select id
  from public.comments
  where user_id in (select id from community_seed_profiles)
     or (
       target_type::text = 'resource'
       and target_id in (select id from community_seed_resources)
     )

  union

  select child.id
  from public.comments child
  join seed_comments parent on child.parent_comment_id = parent.id
)
select id from seed_comments;

delete from public.votes
where user_id in (select id from community_seed_profiles)
   or (
     target_type::text = 'resource'
     and target_id in (select id from community_seed_resources)
   )
   or (
     target_type::text = 'comment'
     and target_id in (select id from community_seed_comments)
   );

delete from public.comments
where id in (select id from community_seed_comments);

delete from public.resources
where id in (select id from community_seed_resources);

delete from public.knowledge_components
where created_by in (select id from community_seed_profiles);

delete from public.profiles
where id in (select id from community_seed_profiles);

delete from auth.users
where id in (select id from community_seed_users);

commit;

-- Verification: every value must be zero.
select
  (select count(*) from auth.users where email in (
    'e2e-maya@coursetexts.dev',
    'e2e-devran@coursetexts.dev',
    'e2e-lena@coursetexts.dev'
  ) or email like 'seed-bot+%@example.com') as remaining_seed_users,
  (select count(*) from public.profiles where email in (
    'e2e-maya@coursetexts.dev',
    'e2e-devran@coursetexts.dev',
    'e2e-lena@coursetexts.dev'
  )
  or email like 'seed-bot+%@example.com'
  or id::text like 'a5eedb07-0000-4000-8000-00000000000_')
    as remaining_seed_profiles,
  (select count(*) from public.resources
   where url like 'https://example.edu/seed/%') as remaining_seed_resources;
