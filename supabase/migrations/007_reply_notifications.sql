-- Track when a user last viewed reply notifications.
alter table public.profiles
  add column if not exists replies_last_read_at timestamptz;

-- Initialize existing rows so old replies don't all appear unread.
update public.profiles
set replies_last_read_at = coalesce(replies_last_read_at, now());
