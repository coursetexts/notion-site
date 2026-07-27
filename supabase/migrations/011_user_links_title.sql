-- Optional title for user bookmarked links
alter table public.user_links
  add column if not exists title text;
