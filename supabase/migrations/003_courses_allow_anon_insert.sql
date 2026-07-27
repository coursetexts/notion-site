-- Allow anyone (including anon) to insert into courses so the first visit creates the course row.
-- Course rows are just references (name, url); no PII.
drop policy if exists "Authenticated users can insert courses" on public.courses;
create policy "Anyone can insert courses"
  on public.courses for insert
  with check (true);
