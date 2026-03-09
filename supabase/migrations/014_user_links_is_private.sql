-- Private links: only visible to the owner (excluded when others view profile)
alter table public.user_links
  add column if not exists is_private boolean not null default false;
