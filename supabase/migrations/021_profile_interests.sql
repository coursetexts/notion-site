-- Per-user interest tags (public read; owners manage their own rows)

create table if not exists public.profile_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  constraint profile_interests_tag_nonempty check (length(trim(tag)) > 0)
);

create unique index if not exists profile_interests_user_tag_lower_idx
  on public.profile_interests (user_id, lower(trim(tag)));

create index if not exists profile_interests_tag_lower_idx
  on public.profile_interests (lower(tag));

alter table public.profile_interests enable row level security;

create policy "Anyone can read profile interests"
  on public.profile_interests for select
  using (true);

create policy "Users insert own profile interests"
  on public.profile_interests for insert
  with check (auth.uid() = user_id);

create policy "Users delete own profile interests"
  on public.profile_interests for delete
  using (auth.uid() = user_id);

-- Paginated directory: profiles + follower counts + tags (single round-trip)
create or replace function public.list_users_directory(
  p_search text,
  p_interest text,
  p_limit int,
  p_offset int
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      p.user_id,
      p.display_name,
      p.avatar_url,
      p.created_at,
      (
        select count(*)::int
        from public.follows f
        where f.following_id = p.user_id
      ) as follower_count
    from public.profiles p
    where
      (
        nullif(trim(coalesce(p_search, '')), '') is null
        or p.display_name ilike '%' || trim(p_search) || '%'
      )
      and (
        nullif(trim(coalesce(p_interest, '')), '') is null
        or exists (
          select 1
          from public.profile_interests pi
          where pi.user_id = p.user_id
            and pi.tag ilike '%' || trim(p_interest) || '%'
        )
      )
  ),
  totals as (
    select count(*)::int as total from base
  ),
  page_users as (
    select b.user_id, b.display_name, b.avatar_url, b.follower_count, b.created_at
    from base b
    order by b.created_at desc
    limit greatest(1, least(coalesce(nullif(p_limit, 0), 24), 48))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select jsonb_build_object(
    'total', (select t.total from totals t),
    'users', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'user_id', pu.user_id,
            'display_name', pu.display_name,
            'avatar_url', pu.avatar_url,
            'follower_count', pu.follower_count,
            'tags', coalesce(
              (
                select jsonb_agg(pi.tag order by lower(pi.tag))
                from public.profile_interests pi
                where pi.user_id = pu.user_id
              ),
              '[]'::jsonb
            )
          )
          order by pu.created_at desc
        )
        from page_users pu
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.list_users_directory(text, text, int, int)
  to anon, authenticated;
