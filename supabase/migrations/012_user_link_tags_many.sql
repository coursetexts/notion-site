-- Many-to-many: links can have multiple tags via junction table
create table public.user_link_tags (
  link_id uuid references public.user_links(id) on delete cascade not null,
  tag_id uuid references public.link_tags(id) on delete cascade not null,
  primary key (link_id, tag_id)
);

create index idx_user_link_tags_link_id on public.user_link_tags(link_id);
create index idx_user_link_tags_tag_id on public.user_link_tags(tag_id);

-- Migrate existing single tag to junction
insert into public.user_link_tags (link_id, tag_id)
  select id, tag_id from public.user_links where tag_id is not null;

alter table public.user_links drop column if exists tag_id;

alter table public.user_link_tags enable row level security;

create policy "Users can read link tags for own links"
  on public.user_link_tags for select
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

create policy "Users can insert link tags for own links"
  on public.user_link_tags for insert
  with check (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );

create policy "Users can delete link tags for own links"
  on public.user_link_tags for delete
  using (
    exists (
      select 1 from public.user_links ul
      where ul.id = link_id and ul.user_id = auth.uid()
    )
  );
