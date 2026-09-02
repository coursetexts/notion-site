-- name: 037_content_reports
-- =============================================================================
-- User reports for annotations, comments, learning paths, and uploaded
-- resources. /reports is the dashboard. Access is open for now; restrict to
-- coursetexts.info@gmail.com later (see lib/content-reports.ts).
-- =============================================================================

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reporter_email text,
  reporter_display_name text,
  target_type text not null,
  target_id text not null,
  target_url text,
  target_title text,
  target_snippet text,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint content_reports_type_ck
    check (target_type in ('annotation', 'comment', 'learning_path', 'resource')),
  constraint content_reports_status_ck
    check (status in ('open', 'reviewed', 'dismissed')),
  constraint content_reports_reason_ck
    check (char_length(trim(reason)) > 0)
);

create unique index if not exists content_reports_reporter_target_uidx
  on public.content_reports (reporter_id, target_type, target_id);

create index if not exists content_reports_created_idx
  on public.content_reports (created_at desc);

create index if not exists content_reports_type_idx
  on public.content_reports (target_type, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Anyone can read content reports"
  on public.content_reports;
create policy "Anyone can read content reports"
  on public.content_reports for select
  using (true);

drop policy if exists "Users can insert own content reports"
  on public.content_reports;
create policy "Users can insert own content reports"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);
