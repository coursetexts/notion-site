-- Published notebooks are readable by anyone (anon + authenticated).
-- Drafts remain owner-only via existing policy.

alter table public.notebooks
  add column if not exists published boolean not null default false;

create index if not exists notebooks_user_published_created_idx
  on public.notebooks (user_id, created_at desc)
  where published;

create policy "Anyone can read published notebooks"
  on public.notebooks for select
  using (published = true);

create policy "Anyone can read tabs of published notebooks"
  on public.notebook_tabs for select
  using (
    exists (
      select 1 from public.notebooks n
      where n.id = notebook_tabs.notebook_id and n.published = true
    )
  );
