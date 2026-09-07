import type { KnowledgeGraphView } from '@/lib/knowledge-graph-view'
import snapshot from '@/data/knowledge-graph.json'

/** Frozen harvest. The page never rebuilds this at runtime. */
export const KNOWLEDGE_GRAPH_SNAPSHOT = snapshot as KnowledgeGraphView
