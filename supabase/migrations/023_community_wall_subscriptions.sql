-- Subscriptions: user follows a course's Community Wall for feed updates.

create table if not exists public.community_wall_subscriptions (
  subscriber_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null references public.courses(notion_page_id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (subscriber_id, course_id)
);

create index if not exists idx_community_wall_subscriptions_subscriber
  on public.community_wall_subscriptions(subscriber_id);
create index if not exists idx_community_wall_subscriptions_course
  on public.community_wall_subscriptions(course_id);

alter table public.community_wall_subscriptions enable row level security;

create policy "Users can read own community wall subscriptions"
  on public.community_wall_subscriptions for select
  using (auth.uid() = subscriber_id);

create policy "Users can insert own community wall subscription"
  on public.community_wall_subscriptions for insert
  with check (auth.uid() = subscriber_id);

create policy "Users can delete own community wall subscription"
  on public.community_wall_subscriptions for delete
  using (auth.uid() = subscriber_id);
