-- =============================================================================
-- DEV SEED — community search test data.
-- Run manually in the Supabase SQL editor (full privileges) against the LIVE
-- community-platform database. Requires 000_community_platform_init,
-- 001_course_comments_bridge.sql, and 002_community_search.sql already applied.
--
-- Everything this file creates is attributable to fixed seed users
-- (display_name 'seed-bot' / 'seed-bot-voter-1'..'-8', fixed uuids below) and
-- is fully removable by running supabase/live/dev_seed_cleanup.sql.
--
-- What it inserts:
--   - 1 auth.users + profiles row for the main author ('seed-bot')
--   - 8 auth.users + profiles rows for voters ('seed-bot-voter-1'..'-8')
--     (separate voters needed because votes are unique per (user, target))
--   - ~70 resources with realistic-sounding academic titles/descriptions,
--     spread across math / cs / physics / biology / econ / chemistry, cycling
--     through all 5 resource types, with several deliberate near-duplicate
--     title clusters (shared keywords) so FTS ties + vote tie-breaks show up
--   - ~35 knowledge_components across the same fields
--   - deterministic votes from the 8 voters on ~40% of resources (setseed)
--   - ~12 top-level comments + a few nested replies on a handful of resources
--
-- NOTE on the resources.type cast: the enum type name is assumed to be
-- public.resource_type (matches the naming convention of
-- public.comment_target_type from 001). If your live schema names it
-- differently, check with:
--   select udt_name from information_schema.columns
--   where table_name = 'resources' and column_name = 'type';
-- and adjust the single `::public.resource_type` cast below accordingly.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0) Seed users. profiles.id references auth.users(id), so auth.users rows
--    must exist first. Fixed, deterministic uuids (valid hex only) so the
--    seed is idempotent and cleanup is exact.
--
--    a5eedb07-0000-4000-8000-000000000001                  -- seed-bot (main author)
--    a5eedb07-0000-4000-8000-000000000002 .. ...009         -- seed-bot-voter-1..8
-- -----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  u.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'seed-bot+' || u.n || '@example.com',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from (
  values
    ('a5eedb07-0000-4000-8000-000000000001'::uuid, 1),
    ('a5eedb07-0000-4000-8000-000000000002'::uuid, 2),
    ('a5eedb07-0000-4000-8000-000000000003'::uuid, 3),
    ('a5eedb07-0000-4000-8000-000000000004'::uuid, 4),
    ('a5eedb07-0000-4000-8000-000000000005'::uuid, 5),
    ('a5eedb07-0000-4000-8000-000000000006'::uuid, 6),
    ('a5eedb07-0000-4000-8000-000000000007'::uuid, 7),
    ('a5eedb07-0000-4000-8000-000000000008'::uuid, 8),
    ('a5eedb07-0000-4000-8000-000000000009'::uuid, 9)
) as u(id, n)
on conflict (id) do nothing;

insert into public.profiles (id, display_name)
values
  ('a5eedb07-0000-4000-8000-000000000001', 'seed-bot'),
  ('a5eedb07-0000-4000-8000-000000000002', 'seed-bot-voter-1'),
  ('a5eedb07-0000-4000-8000-000000000003', 'seed-bot-voter-2'),
  ('a5eedb07-0000-4000-8000-000000000004', 'seed-bot-voter-3'),
  ('a5eedb07-0000-4000-8000-000000000005', 'seed-bot-voter-4'),
  ('a5eedb07-0000-4000-8000-000000000006', 'seed-bot-voter-5'),
  ('a5eedb07-0000-4000-8000-000000000007', 'seed-bot-voter-6'),
  ('a5eedb07-0000-4000-8000-000000000008', 'seed-bot-voter-7'),
  ('a5eedb07-0000-4000-8000-000000000009', 'seed-bot-voter-8')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 1) Resources: ~70 rows, built from template/topic/field arrays combined by
--    index arithmetic so titles are varied and plausible. A handful of
--    templates deliberately repeat a keyword ("eigenvalue", "gradient
--    descent", "topology", "neural network") across 3-4 rows each, to create
--    FTS rank ties that the vote-score tie-break (see 002) can resolve.
-- -----------------------------------------------------------------------------
with templates(tpl) as (
  values
    ('Spectral Theorem for Compact Operators — lecture notes'),
    ('A Gentle Introduction to Eigenvalues and Eigenvectors'),
    ('Eigenvalue Perturbation Bounds: A Short Survey'),
    ('Computing Eigenvalues of Sparse Matrices at Scale'),
    ('Gradient Descent Convergence Rates for Convex Objectives'),
    ('Stochastic Gradient Descent: Variance Reduction Methods'),
    ('Gradient Descent on Non-Convex Landscapes — problem set'),
    ('Adaptive Gradient Descent: A Practitioner''s Guide'),
    ('Point-Set Topology: A First Course'),
    ('Algebraic Topology and the Fundamental Group'),
    ('Topology of Data: An Introduction to Persistent Homology'),
    ('Measure Theory for Probabilists'),
    ('Lebesgue Integration and Measure Theory — problem set'),
    ('Linear Algebra Done Right: Companion Notes'),
    ('Vector Spaces and Linear Maps — slides'),
    ('Neural Network Architectures: A Survey'),
    ('Training Neural Networks with Limited Data'),
    ('Neural Network Pruning and Compression Techniques'),
    ('Convolutional Neural Networks for Image Recognition'),
    ('Graph Algorithms: Shortest Paths and Flows'),
    ('Randomized Algorithms — lecture notes'),
    ('Approximation Algorithms for NP-Hard Problems'),
    ('Distributed Consensus: Paxos and Raft Explained'),
    ('Distributed Systems: Consistency Models — slides'),
    ('Compiler Design: Lexing and Parsing from Scratch'),
    ('Register Allocation via Graph Coloring'),
    ('Introduction to Quantum Mechanics: Wave Functions'),
    ('Quantum Mechanics Problem Set: The Harmonic Oscillator'),
    ('Entanglement and Bell''s Inequality — video lecture'),
    ('Statistical Mechanics: Partition Functions and Entropy'),
    ('The Ising Model: A Statistical Mechanics Primer'),
    ('Electromagnetism: Maxwell''s Equations Derived'),
    ('Electrodynamics of Continuous Media — textbook excerpt'),
    ('Special Relativity for Undergraduates'),
    ('Molecular Biology of the Gene — chapter notes'),
    ('CRISPR-Cas9: Mechanisms and Applications'),
    ('Genetics of Complex Traits: A Primer'),
    ('Neuroscience of Learning and Memory'),
    ('Synaptic Plasticity: Long-Term Potentiation Explained'),
    ('Introduction to Microeconomics: Consumer Theory'),
    ('Game Theory and Strategic Behavior — slides'),
    ('General Equilibrium Theory: An Overview'),
    ('Organic Chemistry Reaction Mechanisms — problem set'),
    ('Physical Chemistry: Thermodynamics of Reactions'),
    ('Category Theory for Programmers'),
    ('Type Theory and the Curry-Howard Correspondence'),
    ('Bayesian Inference: A Practical Introduction'),
    ('Markov Chain Monte Carlo Methods — video lecture'),
    ('Convex Optimization: Duality and KKT Conditions'),
    ('Number Theory: Primes and Modular Arithmetic'),
    ('Differential Geometry of Curves and Surfaces'),
    ('Functional Analysis: Banach and Hilbert Spaces'),
    ('Complexity Theory: P, NP, and Beyond'),
    ('Formal Languages and Automata Theory'),
    ('Operating Systems: Process Scheduling — lecture notes'),
    ('Database Systems: Query Optimization Techniques'),
    ('Cryptography: Public Key Systems Explained'),
    ('Information Theory: Entropy and Channel Capacity'),
    ('Fluid Dynamics: The Navier-Stokes Equations'),
    ('Thermodynamics: The Second Law — slides'),
    ('Cell Biology: Membrane Transport Mechanisms'),
    ('Evolutionary Biology: Natural Selection Models'),
    ('Ecology: Population Dynamics and Stability'),
    ('Astrophysics: Stellar Evolution — video lecture'),
    ('Cosmology: The Early Universe'),
    ('Signal Processing: The Fourier Transform'),
    ('Control Theory: State-Space Models — problem set'),
    ('Robotics: Kinematics and Path Planning'),
    ('Computer Vision: Feature Detection Methods'),
    ('Natural Language Processing: Sequence Models'),
    ('Reinforcement Learning: Policy Gradient Methods')
),
fields(field, idx) as (
  select f, row_number() over ()
  from unnest(array[
    'mathematics','mathematics','mathematics','mathematics',
    'computer science','computer science','computer science','computer science',
    'physics','physics','physics',
    'biology','biology','biology',
    'economics','chemistry'
  ]) as f
),
descs(d, idx) as (
  select dd, row_number() over ()
  from unnest(array[
    'Lecture notes covering the core definitions, worked examples, and a set of practice exercises with solutions.',
    'A survey aimed at graduate students, summarizing the key results and open problems in the area.',
    'Slides from a semester-long course, including diagrams and step-by-step derivations.',
    'A problem set with solutions, designed to build intuition through concrete computation.',
    'An accessible introduction assuming only undergraduate prerequisites, with historical context.',
    'A video lecture walking through the main proof techniques and their applications.',
    'Reference notes distilled from several standard textbooks, with unified notation.',
    'A concise treatment focused on computational aspects and numerical stability.'
  ]) as dd
),
numbered as (
  select
    i,
    (select tpl from templates offset (i % (select count(*) from templates)) limit 1) as title,
    (select field from fields where idx = 1 + (i % (select count(*) from fields))) as field,
    (select d from descs where idx = 1 + (i % (select count(*) from descs))) as description_tpl
  from generate_series(0, 69) as i
)
insert into public.resources (title, description, url, type, status, submitted_by, created_at)
select
  n.title,
  n.description_tpl || ' (' || n.field || ')',
  'https://example.edu/seed/' || n.i,
  (array['textbook','video','paper','slides','problem_set'])[1 + (n.i % 5)]::public.resource_type,
  'approved',
  'a5eedb07-0000-4000-8000-000000000001',
  now() - ((n.i * 7) || ' hours')::interval
from numbered n;

-- -----------------------------------------------------------------------------
-- 2) Knowledge components: ~35 rows across the same fields.
-- -----------------------------------------------------------------------------
with names(nm) as (
  values
    ('Eigenvalues and Eigenvectors'),
    ('Spectral Decomposition'),
    ('Gradient Descent'),
    ('Stochastic Optimization'),
    ('Point-Set Topology'),
    ('Algebraic Topology'),
    ('Measure Theory'),
    ('Linear Independence'),
    ('Vector Spaces'),
    ('Neural Network Backpropagation'),
    ('Convolutional Layers'),
    ('Graph Traversal'),
    ('Randomized Algorithms'),
    ('Distributed Consensus'),
    ('Compiler Parsing'),
    ('Quantum Superposition'),
    ('Wave Function Collapse'),
    ('Statistical Ensembles'),
    ('Entropy'),
    ('Maxwell''s Equations'),
    ('Special Relativity'),
    ('Gene Regulation'),
    ('CRISPR Gene Editing'),
    ('Mendelian Genetics'),
    ('Synaptic Transmission'),
    ('Consumer Utility Theory'),
    ('Nash Equilibrium'),
    ('Reaction Kinetics'),
    ('Thermochemistry'),
    ('Category Theory Morphisms'),
    ('Type Inference'),
    ('Bayesian Priors'),
    ('Markov Chains'),
    ('Convex Duality'),
    ('Modular Arithmetic')
),
fields(field, idx) as (
  select f, row_number() over ()
  from unnest(array[
    'mathematics','mathematics','mathematics','mathematics',
    'computer science','computer science','computer science','computer science',
    'physics','physics','physics',
    'biology','biology','biology',
    'economics','chemistry'
  ]) as f
),
numbered as (
  select
    row_number() over () - 1 as i,
    nm
  from names
)
insert into public.knowledge_components (name, field, description, created_by, created_at)
select
  n.nm,
  (select field from fields where idx = 1 + (n.i % (select count(*) from fields))),
  'Core concept covering ' || lower(n.nm) || ', with links to related resources and prerequisite topics.',
  'a5eedb07-0000-4000-8000-000000000001',
  now() - ((n.i * 11) || ' hours')::interval
from numbered n;

-- -----------------------------------------------------------------------------
-- 3) Votes: each of the 8 voters votes on a deterministic pseudo-random ~40%
--    subset of seed resources. setseed() makes random() reproducible.
-- -----------------------------------------------------------------------------
select setseed(0.42);

with voters(voter_id) as (
  values
    ('a5eedb07-0000-4000-8000-000000000002'::uuid),
    ('a5eedb07-0000-4000-8000-000000000003'::uuid),
    ('a5eedb07-0000-4000-8000-000000000004'::uuid),
    ('a5eedb07-0000-4000-8000-000000000005'::uuid),
    ('a5eedb07-0000-4000-8000-000000000006'::uuid),
    ('a5eedb07-0000-4000-8000-000000000007'::uuid),
    ('a5eedb07-0000-4000-8000-000000000008'::uuid),
    ('a5eedb07-0000-4000-8000-000000000009'::uuid)
),
seed_resources as (
  select id, created_at
  from public.resources
  where submitted_by = 'a5eedb07-0000-4000-8000-000000000001'
),
candidates as (
  select
    v.voter_id,
    r.id as resource_id,
    random() as pick_roll,
    random() as value_roll
  from voters v
  cross join seed_resources r
)
insert into public.votes (user_id, target_type, target_id, value)
select
  voter_id,
  'resource',
  resource_id,
  case when value_roll < 0.8 then 1 else -1 end
from candidates
where pick_roll < 0.4
on conflict (user_id, target_type, target_id) do nothing;

-- -----------------------------------------------------------------------------
-- 4) Comments: ~12 top-level comments on a handful of seed resources, plus a
--    few nested replies (parent_comment_id set, same target resource).
-- -----------------------------------------------------------------------------
with seed_resources as (
  select id, row_number() over (order by created_at) as rn
  from public.resources
  where submitted_by = 'a5eedb07-0000-4000-8000-000000000001'
),
commenters(user_id, rn) as (
  values
    ('a5eedb07-0000-4000-8000-000000000002'::uuid, 1),
    ('a5eedb07-0000-4000-8000-000000000003'::uuid, 2),
    ('a5eedb07-0000-4000-8000-000000000004'::uuid, 3),
    ('a5eedb07-0000-4000-8000-000000000005'::uuid, 4),
    ('a5eedb07-0000-4000-8000-000000000006'::uuid, 5),
    ('a5eedb07-0000-4000-8000-000000000007'::uuid, 6),
    ('a5eedb07-0000-4000-8000-000000000008'::uuid, 7),
    ('a5eedb07-0000-4000-8000-000000000009'::uuid, 8),
    ('a5eedb07-0000-4000-8000-000000000002'::uuid, 9),
    ('a5eedb07-0000-4000-8000-000000000003'::uuid, 10),
    ('a5eedb07-0000-4000-8000-000000000004'::uuid, 11),
    ('a5eedb07-0000-4000-8000-000000000005'::uuid, 12)
),
bodies(body, rn) as (
  values
    ('This derivation clicked for me once I worked through the base case by hand.', 1),
    ('Would love a follow-up covering the numerically unstable edge cases.', 2),
    ('The notation here matches Axler''s textbook, which makes cross-referencing easy.', 3),
    ('Ran the code from section 3 and got a slightly different convergence rate — anyone else?', 4),
    ('This is the clearest explanation of the tie-breaking rule I''ve seen.', 5),
    ('Small typo in the second proof: the inequality should be strict.', 6),
    ('Great problem set — the last exercise really tests whether you understood the lemma.', 7),
    ('Is there a version of this that covers the infinite-dimensional case?', 8),
    ('The historical context at the start is a nice touch, helps motivate the definitions.', 9),
    ('I paired this with the video lecture and it filled in a lot of gaps.', 10),
    ('Bookmarking this for the reading group next week.', 11),
    ('The diagrams make the intuition much clearer than the standard textbook treatment.', 12)
)
insert into public.comments (user_id, parent_comment_id, body, target_type, target_id, created_at)
select
  c.user_id,
  null,
  b.body,
  'resource',
  r.id,
  now() - ((c.rn * 5) || ' hours')::interval
from commenters c
join bodies b using (rn)
join seed_resources r on r.rn = c.rn;

-- Replies: 3 nested replies on the first two top-level comments.
with parents as (
  select cm.id as parent_id, cm.target_id, cm.user_id, row_number() over (order by cm.created_at) as rn
  from public.comments cm
  join public.resources r on r.id = cm.target_id and r.submitted_by = 'a5eedb07-0000-4000-8000-000000000001'
  where cm.user_id in (
    'a5eedb07-0000-4000-8000-000000000002',
    'a5eedb07-0000-4000-8000-000000000003',
    'a5eedb07-0000-4000-8000-000000000004',
    'a5eedb07-0000-4000-8000-000000000005',
    'a5eedb07-0000-4000-8000-000000000006',
    'a5eedb07-0000-4000-8000-000000000007',
    'a5eedb07-0000-4000-8000-000000000008',
    'a5eedb07-0000-4000-8000-000000000009'
  )
  and cm.parent_comment_id is null
  order by cm.created_at
  limit 3
),
replies(reply_body, replier, rn) as (
  values
    ('Agreed, that tripped me up too until I traced through the indices explicitly.', 'a5eedb07-0000-4000-8000-000000000006'::uuid, 1),
    ('Same result on my end — double-checked with a different solver.', 'a5eedb07-0000-4000-8000-000000000007'::uuid, 2),
    ('Good catch, filed a note to fix that in the next revision.', 'a5eedb07-0000-4000-8000-000000000008'::uuid, 3)
)
insert into public.comments (user_id, parent_comment_id, body, target_type, target_id, created_at)
select
  rp.replier,
  p.parent_id,
  rp.reply_body,
  'resource',
  p.target_id,
  now() - '1 hour'::interval
from parents p
join replies rp using (rn);

-- -----------------------------------------------------------------------------
-- 5) Summary
-- -----------------------------------------------------------------------------
select
  (select count(*) from public.resources where submitted_by = 'a5eedb07-0000-4000-8000-000000000001') as resources_inserted,
  (select count(*) from public.knowledge_components where created_by = 'a5eedb07-0000-4000-8000-000000000001') as knowledge_components_inserted,
  (select count(*) from public.votes where user_id in (
    'a5eedb07-0000-4000-8000-000000000002','a5eedb07-0000-4000-8000-000000000003',
    'a5eedb07-0000-4000-8000-000000000004','a5eedb07-0000-4000-8000-000000000005',
    'a5eedb07-0000-4000-8000-000000000006','a5eedb07-0000-4000-8000-000000000007',
    'a5eedb07-0000-4000-8000-000000000008','a5eedb07-0000-4000-8000-000000000009'
  )) as votes_inserted,
  (select count(*) from public.comments c
    join public.resources r on r.id = c.target_id
    where r.submitted_by = 'a5eedb07-0000-4000-8000-000000000001') as comments_inserted;

commit;
