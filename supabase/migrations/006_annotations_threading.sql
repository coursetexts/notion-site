-- Enable threaded annotations (reply-to-reply).
alter table public.annotations
  add column if not exists parent_annotation_id uuid references public.annotations(id) on delete cascade;

create index if not exists idx_annotations_parent_annotation_id
  on public.annotations(parent_annotation_id);
