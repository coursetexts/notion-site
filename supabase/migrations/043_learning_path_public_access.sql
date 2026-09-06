-- name: 043_learning_path_public_access
-- =============================================================================
-- Probe whether a learning-path slug exists without returning its contents.
-- Used so a private (or missing) URL does not render an empty Coursetexts shell.
-- Does not leak owner identity. Invitees and owners already pass RLS SELECT.
-- Requires 042 (`is_learning_path_invitee`).
-- =============================================================================

create or replace function public.learning_path_public_access(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return jsonb_build_object(
      'exists', false,
      'accessible', false,
      'visibility', null
    );
  end if;

  select
    lp.id,
    lp.visibility,
    lp.is_catalog,
    lp.owner_id
  into rec
  from public.learning_paths lp
  where lp.slug = trim(p_slug)
  limit 1;

  if not found then
    return jsonb_build_object(
      'exists', false,
      'accessible', false,
      'visibility', null
    );
  end if;

  if rec.is_catalog
     or rec.visibility in ('public', 'collaborative')
     or rec.owner_id = auth.uid()
     or public.is_learning_path_invitee(rec.id) then
    return jsonb_build_object(
      'exists', true,
      'accessible', true,
      'visibility', rec.visibility
    );
  end if;

  return jsonb_build_object(
    'exists', true,
    'accessible', false,
    'visibility', rec.visibility
  );
end;
$$;

revoke all on function public.learning_path_public_access(text) from public;
grant execute on function public.learning_path_public_access(text) to anon, authenticated;
