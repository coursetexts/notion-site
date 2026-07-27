-- Allow anyone to read user_links, link_tags, and user_link_tags so profiles can show bookmarked links
create policy "Anyone can read user links"
  on public.user_links for select using (true);

create policy "Anyone can read link tags"
  on public.link_tags for select using (true);

create policy "Anyone can read user link tags"
  on public.user_link_tags for select using (true);
