-- name: 059_content_reports_admin_read
-- =============================================================================
-- /reports is no longer publicly readable. SELECT is limited to the admin
-- emails in lib/content-reports.ts (REPORTS_ADMIN_EMAILS). Signed-in users
-- can still insert their own reports.
-- =============================================================================

drop policy if exists "Anyone can read content reports"
  on public.content_reports;

drop policy if exists "Admins can read content reports"
  on public.content_reports;

create policy "Admins can read content reports"
  on public.content_reports for select
  using (
    lower(trim(coalesce(auth.jwt() ->> 'email', ''))) in (
      'eeshaulh@gmail.com',
      'admin@bencuan.me',
      'coursetexts.info@gmail.com'
    )
  );
