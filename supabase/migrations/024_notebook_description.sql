-- Optional notebook blurb (shown on notebook page sidebar; profile list unchanged)

alter table public.notebooks
  add column if not exists description text not null default '';
