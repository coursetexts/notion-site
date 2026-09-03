# Knowledge (profile + collective graph)

Topics you pick up by finishing learning paths, plus an optional Coursetexts-wide graph of how those topics relate.

## What people see

On `/profile` and `/profile/{userId}`, the primary tabs are **Learning | Knowledge | Notes | Bookmarks | Activity**. **Notes** is owner-only (`/profile`). Search fields on those tabs share one width.

The Knowledge tab is a **list** of unique topics for that user (`user_knowledge_topics`), A–Z, with search. On your own profile you can add a topic and export the list. The profile graph view is hidden.

On a learning path (`/learning-path/{slug}`), finishing the last remaining topic:

1. Asks how long the last module took and a 0–100% enjoyment rating (same popup as other newly explored topics, unless that topic was already rated)
2. Plays a blue confetti burst
3. Opens a **Path complete** / **Course complete** modal listing the concepts, plus duration and enjoyment for the whole map
4. Adds a **What you learned** row at the bottom of the left outline (hidden until the path is finished)

The outline marks progress with a square only (blue filled = explored). **Explored** / **Mark unexplored** lives on the topic action in the main pane, not as outline text.

**Finished** means every non-goal node is `explored` (community/research) or every flattened syllabus node is in the explored set (course). Un-exploring a topic hides the What you learned tab again until the path is complete.

Existing DBs: apply `035_user_knowledge_topics.sql` and `036_knowledge_graph.sql`. For duration + enjoyment % after explore/finish, apply `038_learning_path_ratings.sql` (and `039` if an older 1–5 `rating` check is already live).

## How topics get onto a profile

Finishing a path (or loading an already-finished path while signed in) upserts labels from that path into `user_knowledge_topics`, unique on `(user_id, normalized_label)`. Goal nodes are skipped. Duplicates across paths collapse.

If `035` is not applied yet, the client still stores topics in `localStorage` (`coursetexts.user-knowledge-topics:{userId}`).

Un-exploring a topic does **not** delete it from the Knowledge tab. You still “have” that concept; it just is not explored on that path anymore.

## Shared catalog (collective graph)

`knowledge_topics` is one Coursetexts-wide list of labels. `knowledge_topic_edges` links them (`prerequisite` | `related` | `part_of`) from:

| Source | When |
|--------|------|
| `path_structure` | Public / collaborative / catalog path outlines and course parent→child / sibling links. Private paths do not contribute structure. |
| `llm` | Optional Gemini pass that only links **existing** catalog labels (does not invent topics). **This job is implemented and currently disabled.** |

Public `SELECT`. Writes use the service role (ingest API or the cron handler).

When a signed-in user finishes a public path, the client also `POST`s `/api/knowledge-graph/ingest` with those labels and structural edges. That incremental ingest **is** on. It does not call Gemini.

## Daily LLM rebuild — disabled

`pages/api/cron/rebuild-knowledge-graph.ts` can harvest public paths and ask Gemini for a small batch of extra edges (`lib/knowledge-graph-harvest.ts`, `lib/knowledge-graph-llm.ts`). We are **not running that automatically**.

What is off today:

- `vercel.json` has `"crons": []` (no Vercel schedule)
- The handler returns `{ disabled: true }` unless `KNOWLEDGE_GRAPH_CRON_ENABLED=true`

The harvest/LLM code stays in the repo so we can turn it on later.

To enable later:

1. Set `KNOWLEDGE_GRAPH_CRON_ENABLED=true`
2. Set `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (optional `GEMINI_MODEL`)
3. Restore this cron in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/rebuild-knowledge-graph",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Vercel will send `Authorization: Bearer $CRON_SECRET`. The job is incremental (~8 focus topics + neighbors/candidates) and `maxDuration` is 60s.

Until then, catalog ingest still writes structural edges. The Knowledge tab no longer shows a graph; `ProfileKnowledgeGraph` stays in the repo if we turn that view back on.
