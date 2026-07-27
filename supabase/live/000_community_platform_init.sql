-- =============================================================================
-- LIVE community-platform baseline.
--
-- This is the schema required by /community before applying 001, 002, and 003.
-- It intentionally lives separately from supabase/migrations/, which targets
-- the legacy course-page schema and must not be mixed into this database.
-- =============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.resource_type as enum (
    'textbook', 'video', 'paper', 'slides', 'problem_set'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_status as enum (
    'pending', 'approved', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comment_target_type as enum ('resource', 'comment');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  karma_score integer not null default 0,
  replies_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  description text,
  url text not null,
  type public.resource_type not null,
  status public.resource_status not null default 'approved',
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_components (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 300),
  field text,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.comment_target_type not null,
  target_id uuid not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.comment_target_type not null,
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists resources_created_at_idx
  on public.resources(created_at desc);
create index if not exists resources_submitted_by_idx
  on public.resources(submitted_by);
create index if not exists comments_target_idx
  on public.comments(target_type, target_id, created_at);
create index if not exists comments_parent_idx
  on public.comments(parent_comment_id);
create index if not exists votes_target_idx
  on public.votes(target_type, target_id);

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.knowledge_components enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

create policy "Public profiles are readable"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Resources are publicly readable"
  on public.resources for select using (true);
create policy "Authenticated users can submit resources"
  on public.resources for insert
  with check ((select auth.uid()) = submitted_by);
create policy "Authors can update their resources"
  on public.resources for update
  using ((select auth.uid()) = submitted_by)
  with check ((select auth.uid()) = submitted_by);
create policy "Authors can delete their resources"
  on public.resources for delete
  using ((select auth.uid()) = submitted_by);

create policy "Knowledge components are publicly readable"
  on public.knowledge_components for select using (true);
create policy "Authenticated users can add knowledge components"
  on public.knowledge_components for insert
  with check ((select auth.uid()) = created_by);
create policy "Authors can update their knowledge components"
  on public.knowledge_components for update
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);
create policy "Authors can delete their knowledge components"
  on public.knowledge_components for delete
  using ((select auth.uid()) = created_by);

create policy "Comments are publicly readable"
  on public.comments for select using (true);
create policy "Authenticated users can add comments"
  on public.comments for insert
  with check ((select auth.uid()) = user_id);
create policy "Authors can update their comments"
  on public.comments for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Authors can delete their comments"
  on public.comments for delete
  using ((select auth.uid()) = user_id);

create policy "Votes are publicly readable"
  on public.votes for select using (true);
create policy "Authenticated users can add their votes"
  on public.votes for insert
  with check ((select auth.uid()) = user_id);
create policy "Users can update their votes"
  on public.votes for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their votes"
  on public.votes for delete
  using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
