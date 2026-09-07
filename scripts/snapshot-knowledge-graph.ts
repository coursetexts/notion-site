/**
 * One-off snapshot of the public knowledge graph.
 * The /knowledge-graph page reads data/knowledge-graph.json — it does not harvest.
 *
 * Usage: npx tsx scripts/snapshot-knowledge-graph.ts
 */
import fs from 'fs'
import path from 'path'

import { collectSeededHarvest, mergeHarvested } from '../lib/knowledge-graph-harvest'
import { harvestGraphFromLearningPathData, mergeEdgeDrafts } from '../lib/knowledge-graph'
import { listFilledCuratedCoursePayloads } from '../lib/curated-course-catalog'
import {
  compactKnowledgeGraphView,
  knowledgeGraphViewFromHarvest
} from '../lib/knowledge-graph-view'

function collectSnapshotHarvest() {
  const harvest = collectSeededHarvest()
  for (const item of listFilledCuratedCoursePayloads()) {
    const graph = harvestGraphFromLearningPathData(item.data)
    if (!graph) continue
    mergeHarvested(harvest, graph, {
      id: item.slug,
      slug: item.slug,
      title: item.title,
      kind: 'course'
    })
  }
  harvest.edges = mergeEdgeDrafts(harvest.edges)
  return harvest
}

const harvest = collectSnapshotHarvest()
const graph = compactKnowledgeGraphView(
  knowledgeGraphViewFromHarvest(harvest, { source: 'snapshot' }),
  true
)

const out = path.join(process.cwd(), 'data/knowledge-graph.json')
fs.writeFileSync(out, `${JSON.stringify(graph)}\n`)
console.log(
  `Wrote ${out} (${graph.topics.length} topics, ${graph.paths.length} paths)`
)
