-- name: 001_extensions_and_enums
-- =============================================================================
-- Extensions + enums (final schema)
-- =============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.resource_type as enum (
    'textbook', 'video', 'paper', 'slides', 'problem_set'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_status as enum (
    'pending', 'approved', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.curated_course_node_type as enum (
    'topic', 'subtopic', 'concept'
  );
exception when duplicate_object then null;
end $$;
