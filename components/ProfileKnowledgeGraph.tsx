import * as React from 'react'

import { GraphViewport } from '@/components/GraphViewport'
import type { KnowledgeGraphSubset } from '@/lib/knowledge-graph-db'
import { layoutKnowledgeGraph } from '@/lib/knowledge-graph-layout'
import { edgePath } from '@/lib/learning-path-graph-layout'
import lp from '@/components/LearningPath.module.css'
import styles from '@/styles/profile.module.css'

export function ProfileKnowledgeGraph({
  graph
}: {
  graph: KnowledgeGraphSubset
}) {
  const layout = React.useMemo(
    () => layoutKnowledgeGraph(graph.nodes, graph.edges),
    [graph]
  )

  if (graph.nodes.length === 0) return null

  return (
    <div className={styles.knowledgeGraphStage}>
      <GraphViewport
        scrollerClassName={`${lp.mapScroll} ${styles.knowledgeGraphScroll}`}
        padClassName={lp.graphPad}
        canvasClassName={lp.canvas}
        canvasStyle={
          {
            '--graph-w': `${layout.width}px`,
            '--graph-h': `${layout.height}px`
          } as React.CSSProperties
        }
      >
        <svg
          className={lp.connections}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio='xMinYMin meet'
          aria-hidden
        >
          {graph.edges.map((edge) => {
            const fromPos = layout.positions[edge.fromId]
            const toPos = layout.positions[edge.toId]
            if (!fromPos || !toPos) return null
            return (
              <path
                key={`${edge.fromId}-${edge.toId}-${edge.kind}`}
                d={edgePath(fromPos, toPos)}
                style={{ strokeWidth: 1.4 }}
              />
            )
          })}
        </svg>
        {graph.nodes.map((node) => {
          const pos = layout.positions[node.id]
          if (!pos) return null
          return (
            <div
              key={node.id}
              className={`${lp.node} ${lp.nodeExplored} ${styles.knowledgeGraphNode}`}
              style={{ left: pos.x, top: pos.y }}
            >
              <span className={lp.nodeStatus} />
              <span className={lp.nodeHead}>
                <span className={lp.nodeLabel}>{node.label}</span>
              </span>
              <span className={lp.nodeSub}>Acquired</span>
            </div>
          )
        })}
      </GraphViewport>
    </div>
  )
}
