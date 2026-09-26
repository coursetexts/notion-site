-- name: 058_catalog_related_terms
-- =============================================================================
-- Gemini-generated search phrases for catalog items (index time only).
-- Public read: these are search aliases, not private content.
-- Writes stay service_role (no insert/update/delete policies).
-- =============================================================================

create table if not exists public.catalog_related_terms (
  item_kind text not null check (
    item_kind in ('learning-path', 'university-course')
  ),
  item_id text not null,
  terms text[] not null default '{}',
  source_hash text not null,
  updated_at timestamptz not null default now(),
  primary key (item_kind, item_id)
);

create index if not exists catalog_related_terms_kind_idx
  on public.catalog_related_terms (item_kind);

alter table public.catalog_related_terms enable row level security;

drop policy if exists catalog_related_terms_select_all
  on public.catalog_related_terms;
create policy catalog_related_terms_select_all
  on public.catalog_related_terms
  for select
  using (true);

grant select on table public.catalog_related_terms
  to anon, authenticated, service_role;
