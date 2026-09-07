/**
 * Server helper kept for a manual snapshot rebuild only.
 * /knowledge-graph does not call this. GET /api/knowledge-graph does not harvest.
 */

import { KNOWLEDGE_GRAPH_SNAPSHOT } from '@/lib/knowledge-graph-snapshot'
import type { KnowledgeGraphView } from '@/lib/knowledge-graph-view'

export async function loadKnowledgeGraphView(): Promise<KnowledgeGraphView> {
  return KNOWLEDGE_GRAPH_SNAPSHOT
}
