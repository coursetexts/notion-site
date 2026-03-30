-- Enable threaded comments (reply-to-reply) using adjacency list model.
alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;

create index if not exists idx_comments_parent_comment_id
  on public.comments(parent_comment_id);
