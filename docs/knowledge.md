# Knowledge (profile + collective graph)

Topics you pick up by finishing learning paths, plus a Coursetexts-wide graph of how those topics recur across paths.

## What people see

`/knowledge-graph` is a public map of **knowledge components** harvested from filled course syllabi and public community/research learning paths. Matching titles collapse onto one node. Click a topic to see every learning path it appears on. The default view is recurring syllabus **topics** (and community path nodes). **Include matching concepts** adds leaf labels that also recur. Exact wording matches today; an LLM pass can later cluster similar names (`KNOWLEDGE_GRAPH_LLM_CLUSTER_SCHEMA` in `lib/knowledge-graph-llm.ts` — not wired yet).

The page reads a frozen snapshot (`data/knowledge-graph.json`). It does **not** call `GET /api/knowledge-graph` (that route returns **410 Gone**) and does not harvest on load. To rebuild the snapshot on purpose: `npx tsx scripts/snapshot-knowledge-graph.ts`.

On `/profile` and `/profile/{userId}`, the primary tabs are **Learning → Knowledge → Notes → Resources → Feed → Notifications** (Notes and Notifications are owner-only on `/profile`). A subtle divider separates Learning/Knowledge/Notes/Resources from Feed/Notifications. Search fields on those tabs share one width. Learning streak tags on some cards are **mocked** only — see [gaps.md](./gaps.md). Hover a Learning card on **your** profile for resume (description + progress + **Continue →**); on someone else’s profile, hover shows **description only**. Public profiles also expose a **Committed** filter (read-only; needs migration `052`). Feed hosts Updates (plain text posts, **Repost** / **Quote**, nested original cards) and followed social activity (**Following** · **Yours**). Comments/discussions lead with a target card then a spine to the actor. Notifications show an unread count badge left of the tab label and a faint blue background on new cards; they cover follows, likes, reposts, quotes, replies, path invites, and resource suggestion review/acceptance.

The Knowledge tab is a **list** of unique topics for that user (`user_knowledge_topics`), A–Z, with search. On your own profile you can add a topic and export the list. The profile graph view is hidden.

On a learning path (`/learning-path/{slug}`), finishing the last remaining topic:

1. Asks how long the last module took and a 0–100% enjoyment rating (same popup as other newly explored topics, unless that topic was already rated)
2. Plays a blue confetti burst
3. Opens a **Path complete** / **Course complete** modal listing the concepts, plus duration and enjoyment for the whole map
4. Adds a **What you learned** row at the bottom of the left outline (hidden until the path is finished)

The outline marks progress with a light-blue stroke check when a topic is explored (shown on parent accordion rows and nested steps). **Mark as explored** / **✓ Explored** lives on the shared bottom **StepNavBar**, not as outline text.

**Finished** means every non-goal node is `explored` (community/research) or every flattened syllabus node is in the explored set (course). Un-exploring a topic hides the What you learned tab again until the path is complete.

Existing DBs: apply `035_user_knowledge_topics.sql`, `036_knowledge_graph.sql`, and `045_knowledge_topic_path_occurrences.sql`. For duration + enjoyment % after explore/finish, apply `038_learning_path_ratings.sql` (and `039` if an older 1–5 `rating` check is already live).

## How topics get onto a profile

Finishing a path (or loading an already-finished path while signed in) upserts labels from that path into `user_knowledge_topics`, unique on `(user_id, normalized_label)`. Goal nodes are skipped. Duplicates across paths collapse.

If `035` is not applied yet, the client still stores topics in `localStorage` (`coursetexts.user-knowledge-topics:{userId}`).

Un-exploring a topic does **not** delete it from the Knowledge tab. You still “have” that concept; it just is not explored on that path anymore.

## Shared catalog (collective graph)

`knowledge_topics` is one Coursetexts-wide list of labels. `knowledge_topic_path_occurrences` records which public learning paths each label appears on. `knowledge_topic_edges` links topics (`prerequisite` | `related` | `part_of`) from:

| Source | When |
|--------|------|
| `path_structure` | Public / collaborative / catalog path outlines and course parent→child / sibling links. Private paths do not contribute structure. |
| `llm` | Optional Gemini pass that only links **existing** catalog labels (does not invent topics). **This job is implemented and currently disabled.** |

Public `SELECT`. Writes use the service role (ingest API or the cron handler).

When a signed-in user finishes a public path, the client also `POST`s `/api/knowledge-graph/ingest` with those labels, structural edges, and the path identity so occurrences can be upserted. That incremental ingest **is** on. It does not call Gemini.

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

Vercel will send `Authorization: Bearer $CRON_SECRET`. The job is incremental (~8 focus topics + neighbors/candidates) and `maxDuration` is 60s. Harvest also upserts `knowledge_topic_path_occurrences`.

The next LLM step is clustering similar labels across paths (`KNOWLEDGE_GRAPH_LLM_CLUSTER_SCHEMA`). Do not invent new topics. Until that is wired, `/knowledge-graph` uses exact `normalized_label` matches.

Until then, catalog ingest still writes structural edges and path occurrences. The Knowledge tab no longer shows a graph; `ProfileKnowledgeGraph` stays in the repo if we turn that view back on.
