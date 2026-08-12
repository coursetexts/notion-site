-- name: 014_curated_course_resources
-- =============================================================================
-- Curated-course resources (textbooks / websites / video channels)
-- NOTE: public.course_resources already exists (Community Wall) — do not reuse.
-- =============================================================================

do $$ begin
  create type public.curated_course_resource_kind as enum (
    'textbook', 'website', 'youtube'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.curated_course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null
    references public.curated_courses(id) on delete cascade,
  kind public.curated_course_resource_kind not null,
  title text not null check (char_length(title) between 1 and 500),
  link_or_site text not null check (char_length(link_or_site) between 1 and 2048),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curated_course_resources_course_idx
  on public.curated_course_resources(course_id, kind, sort_order);

alter table public.curated_course_resources enable row level security;

drop policy if exists "Curated course resources are publicly readable"
  on public.curated_course_resources;
create policy "Curated course resources are publicly readable"
  on public.curated_course_resources for select using (true);

drop policy if exists "Authenticated users can insert curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can insert curated course resources"
  on public.curated_course_resources for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can update curated course resources"
  on public.curated_course_resources for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete curated course resources"
  on public.curated_course_resources;
create policy "Authenticated users can delete curated course resources"
  on public.curated_course_resources for delete
  using (auth.uid() is not null);
