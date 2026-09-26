# How catalog search works

Plain-English guide to search on Coursetexts and Paths. The technical checklist lives in [semantic catalog search](./plans/semantic-learning-path-search/README.md).

## What we are trying to do

Someone should be able to type what they mean, not the exact card title.

- “make a chatbot” should still find a transformers / AI path.
- The search box should stay **fast**. Results should appear as they type, not after a long “thinking” pause.

Those two goals pull in opposite directions. A big language model (Gemini) is good at meaning and bad at “instant and cheap on every keystroke.” A small embedding model is the reverse: cheap and fast, but it only knows what we wrote on the card.

So we **do not** ask Gemini to rank the catalog while someone is typing. We use a cheap search now, and let Gemini **enrich each path once** when we index it.

## What happens when you type

There are two searches at once. Their results are merged on the page.

**1. Word match (lexical)**  
The browser looks for shared words in titles, goals, and descriptions. Fast, no server. “Corporate Finance” matches `finance`. “How to publish a book in New York” does **not** match `english`, because that word is not on the card.

**2. Meaning match (semantic)**  
After a short pause (about 300ms), the server turns the query into a list of numbers (an embedding) and asks the database for nearby cards. This is how “make a chatbot” can find a path that never uses the word chatbot.

```text
You type  →  word match shows immediately
         →  ~300ms later, nearby cards from the database are mixed in
         →  if the server fails, you still have word match
```

**Where it runs**

| Page | What semantic search can return |
| ---- | -------------------------------- |
| `/all-courses` | Official Notion university courses only |
| `/paths/all-courses` | Learning paths **and** Notion courses |

Degree curricula and Field Atlas questions are still word-match only.

## What we store for “meaning”

Each public learning path (and each Notion course) gets one short text blob, then one 384-number vector in Supabase.

For a path that text is roughly:

> title. goal. summary. Topics: topic name: short description, …

We include topic **names and descriptions**. We do **not** include “why” blurbs or resource titles (a random textbook title would pull the path toward the wrong subject).

The model is `Xenova/bge-small-en-v1.5`, running on **our server**, not in the browser, and not billed per search. Same idea as a tiny “this sentence is about X” encoder.

We only index paths people can already see in the catalog (not private ones, not empty course stubs).

## Why some searches still miss

Embeddings compare **wording**, not **school subjects**.

| You type | You hoped for | What often happens |
| -------- | ------------- | ------------------ |
| `english` | A publishing / writing path | Closest vectors are courses that actually say “English” |
| `black scholes` | A finance syllabus | The formula name was never on the card, so neighbors can be random |

A growing hand-written synonym list (`english` → publishing, `black scholes` → options) can paper over a few of these. It does **not** scale. We will not maintain a thesaurus for every query.

## Related terms at index time

We use Gemini **once per path**, when we embed it — not when someone searches.

1. Send the path’s title, goal, summary, and topics to Gemini.
2. Ask for a short list of search phrases a learner might type (about 10–15). Example for a NYC publishing path: `english`, `creative writing`, `literary agents`, `debut novel`.
3. Save that list on the path.
4. Put the same phrases into the embedding text and into word-match extras.
5. Only run this again when the path text changes (same hash skip we already use for embeddings).

Search stays the same fast loop. Gemini just writes better catalog text than we would by hand.

**Rules so this stays honest**

- Terms must be justified by the path text (no inventing “quantum physics” on a baking path).
- Cap the list. Do not dump the whole outline into the prompt.
- Do **not** call Gemini on every keystroke, and do **not** ask it to score all ~2,000 paths for each query.

A tiny jargon list (`zk`, `nlp`) can stay as a last-resort extra. Subject chips (English, Math) stay **filters**, not a substitute for typing `english`.

## What we are not doing

- Running the embedding model in the browser.
- Ranking live search with Gemini, Jev, or any chat model.
- Embedding private paths, degree JSON, or Field Atlas questions (unless we decide to later).
- Replacing word match. It still catches exact titles.

## Cost as we grow

Prices move. These are **order-of-magnitude** figures so we can decide architecture, not a finance forecast. Gemini Flash paid rates around **$0.75 / 1M input tokens** and **$3.75 / 1M output tokens** (2026 intro Flash pricing; we default to `gemini-2.5-flash` for path fill today). Turn **thinking** off for this job or output tokens get expensive.

### Search (every time someone types)

| Piece | Who pays | At 100 paths | At 2,000 paths | At 50,000 searches / month |
| ----- | -------- | ------------ | -------------- | -------------------------- |
| Word match | User’s browser | $0 | $0 | $0 |
| Query embedding + pgvector | Our server CPU / existing Supabase | ~$0 API | Still ~$0 API. 2k vectors is a small index. | ~$0 API. Cost is server RAM/CPU for the model process, not Gemini. |
| Gemini on **each** search (we will not do this) | Gemini API | — | — | Roughly **$50–$200+ / month** if every search called Flash, plus a 1–3s wait. Feels broken. |

Embeddings stay almost free as **traffic** grows. They do not get more expensive because more people search. They get a bit heavier if we run many Node servers each loading the model.

### Indexing (when we add or edit catalog cards)

This is the only place Gemini should show up for search.

Assume one small related-term call per path: about **1,500 input tokens** (prompt + clipped path text) and **150 output tokens** (a short phrase list). That is about **$0.002 per path** at the rates above.

| Catalog size | One-time Gemini pass (related terms) | Re-run only when a path’s text changes |
| ------------ | ------------------------------------ | -------------------------------------- |
| ~110 paths (today) | About **$0.20** | Pennies unless we rewrite everything |
| 2,000 paths | About **$4** | Same, only for edited rows |
| 10,000 paths | About **$20** | Still cheap if we hash-skip unchanged rows |

If we accidentally send full syllabi and leave model “thinking” on, it can jump toward **$0.01–$0.03 per path** ($20–$60 for 2,000). Keep the prompt short.

Re-embedding with Xenova after the terms are saved is **$0** in API fees (CPU time only). A full 2,000-path backfill is minutes, not a bill.

### Year-one picture if we do this well

- **Search:** still ~$0 Gemini, even if the site is busy.
- **New / edited public paths:** a few dollars a year at 2k paths, unless we rebuild the whole catalog often.
- **Path fill** (creating outlines) stays the larger Gemini bill. Related terms are a rounding error next to that.

## How to operate what we have today

```bash
yarn test:semantic-learning-path-search
yarn embed:related-terms:dry
yarn embed:related-terms
yarn embed:learning-paths --dry-run
yarn embed:learning-paths
yarn embed:notion-courses:dry
```

`yarn embed:related-terms` writes `catalog_related_terms` (migration `058`) then re-embeds so vectors include the phrases. Production writes need the usual project-ref guard and `ALLOW_PRODUCTION_LEARNING_PATH_EMBED_BACKFILL=true`. Reuses `GEMINI_API_KEY` / `GEMINI_MODEL`. The embedder is never imported from browser code.
