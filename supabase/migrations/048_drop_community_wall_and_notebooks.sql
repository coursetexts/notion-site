-- name: 048_drop_community_wall_and_notebooks
-- Drops legacy per-course Community Wall tables (008, 011) and standalone notebooks (009).

drop table if exists public.community_wall_subscriptions cascade;
drop table if exists public.course_resource_bookmarks cascade;
drop table if exists public.course_resource_comments cascade;
drop table if exists public.course_resource_votes cascade;
drop table if exists public.course_resources cascade;
drop table if exists public.notebook_tabs cascade;
drop table if exists public.notebooks cascade;
