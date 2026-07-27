-- Allow reading any user's community wall resource bookmarks (for public profile pages),
-- matching public.bookmarks behavior (see 009_follows_and_public_profiles.sql).

create policy "Anyone can read course resource bookmarks"
  on public.course_resource_bookmarks for select using (true);
