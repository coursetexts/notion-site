-- Votes for comments and annotations (one row per user per target: value 1 or -1)
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target_type text not null check (target_type in ('comment', 'annotation')),
  target_id uuid not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);

create index idx_votes_target on public.votes(target_type, target_id);

alter table public.votes enable row level security;

create policy "Anyone can read votes"
  on public.votes for select using (true);

create policy "Authenticated users can insert own vote"
  on public.votes for insert with check (auth.uid() = user_id);

create policy "Users can update own vote"
  on public.votes for update using (auth.uid() = user_id);

create policy "Users can delete own vote"
  on public.votes for delete using (auth.uid() = user_id);

-- Remove votes when comment or annotation is deleted
create or replace function public.delete_comment_votes()
returns trigger language plpgsql security definer as $$
begin
  delete from public.votes where target_type = 'comment' and target_id = old.id;
  return old;
end;
$$;

create or replace function public.delete_annotation_votes()
returns trigger language plpgsql security definer as $$
begin
  delete from public.votes where target_type = 'annotation' and target_id = old.id;
  return old;
end;
$$;

create trigger on_comment_delete_votes
  after delete on public.comments
  for each row execute function public.delete_comment_votes();

create trigger on_annotation_delete_votes
  after delete on public.annotations
  for each row execute function public.delete_annotation_votes();
