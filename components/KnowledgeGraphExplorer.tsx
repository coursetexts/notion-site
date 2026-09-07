import * as React from 'react'
import Link from 'next/link'

import { GraphViewport } from '@/components/GraphViewport'
import lp from '@/components/LearningPath.module.css'
import styles from '@/components/KnowledgeGraphExplorer.module.css'
import { layoutKnowledgeOccurrenceGraph } from '@/lib/knowledge-graph-layout'
import { KNOWLEDGE_GRAPH_SNAPSHOT } from '@/lib/knowledge-graph-snapshot'
import {
  type KnowledgeGraphTopicView,
  type KnowledgeGraphView,
  compactKnowledgeGraphView,
  knowledgeGraphPathNodeId,
  topicIsGraphDefault
} from '@/lib/knowledge-graph-view'
import { learningPathKicker } from '@/lib/learning-path-kind-ui'

const GRAPH_TOPIC_CAP = 180

function pathCountLabel(count: number) {
  return count === 1 ? '1 learning path' : `${count} learning paths`
}

function topicMatchesQuery(topic: KnowledgeGraphTopicView, query: string) {
  if (!query) return true
  if (topic.label.toLowerCase().includes(query)) return true
  return topic.paths.some(
    (path) =>
      path.title.toLowerCase().includes(query) ||
      path.slug.toLowerCase().includes(query)
  )
}

function visibleTopics(
  graph: KnowledgeGraphView,
  query: string,
  includeConcepts: boolean
): KnowledgeGraphTopicView[] {
  const searched = graph.topics.filter((topic) =>
    topicMatchesQuery(topic, query)
  )
  const pool = query
    ? searched
    : searched.filter((topic) =>
        includeConcepts
          ? topic.paths.length >= 2
          : topicIsGraphDefault(topic)
      )
  return pool.slice(0, GRAPH_TOPIC_CAP)
}

export function KnowledgeGraphExplorer() {
  const [query, setQuery] = React.useState('')
  const [includeConcepts, setIncludeConcepts] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const graph = React.useMemo(
    () => compactKnowledgeGraphView(KNOWLEDGE_GRAPH_SNAPSHOT, includeConcepts),
    [includeConcepts]
  )
  const search = query.trim().toLowerCase()
  const topics = React.useMemo(
    () => visibleTopics(graph, search, includeConcepts),
    [graph, search, includeConcepts]
  )
  const pathIds = React.useMemo(() => {
    const ids = new Set<string>()
    for (const topic of topics) {
      for (const path of topic.paths) {
        ids.add(knowledgeGraphPathNodeId(path.slug))
      }
    }
    return ids
  }, [topics])
  const paths = React.useMemo(
    () =>
      (graph?.paths ?? []).filter((path) =>
        pathIds.has(knowledgeGraphPathNodeId(path.slug))
      ),
    [graph, pathIds]
  )
  const layout = React.useMemo(
    () =>
      layoutKnowledgeOccurrenceGraph(
        topics.map((topic) => ({
          id: topic.id,
          pathIds: topic.paths.map((path) => knowledgeGraphPathNodeId(path.slug))
        })),
        paths.map((path) => ({ id: knowledgeGraphPathNodeId(path.slug) }))
      ),
    [topics, paths]
  )

  const selectedTopic = topics.find((topic) => topic.id === selectedId) ??
    graph?.topics.find((topic) => topic.id === selectedId) ??
    null
  const selectedPath =
    selectedId && selectedId.startsWith('path:')
      ? paths.find((path) => knowledgeGraphPathNodeId(path.slug) === selectedId) ??
        graph?.paths.find(
          (path) => knowledgeGraphPathNodeId(path.slug) === selectedId
        ) ??
        null
      : null

  const focusPathSlugs = React.useMemo(() => {
    if (selectedTopic) return new Set(selectedTopic.paths.map((path) => path.slug))
    if (selectedPath) return new Set([selectedPath.slug])
    return null
  }, [selectedTopic, selectedPath])

  const relatedTopicIds = React.useMemo(() => {
    if (!focusPathSlugs || !graph) return null
    const ids = new Set<string>()
    for (const topic of topics) {
      if (topic.paths.some((path) => focusPathSlugs.has(path.slug))) {
        ids.add(topic.id)
      }
    }
    return ids
  }, [focusPathSlugs, graph, topics])

  function isDimmed(id: string, kind: 'topic' | 'path') {
    if (!focusPathSlugs) return false
    if (kind === 'path') {
      const slug = id.slice('path:'.length)
      return !focusPathSlugs.has(slug)
    }
    return relatedTopicIds ? !relatedTopicIds.has(id) : false
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h1 className={styles.title}>Knowledge graph</h1>
        <p className={styles.subtitle}>
          Knowledge components harvested from Coursetexts learning paths.
          Matching titles collapse onto one node so you can see which paths
          they reoccur in. An LLM pass can later group similar names that are
          not spelled the same.
        </p>
        <div className={styles.toolbar}>
          <input
            type='search'
            className={styles.search}
            placeholder='Search topics or learning paths'
            aria-label='Search topics or learning paths'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className={styles.toggle}>
            <input
              type='checkbox'
              checked={includeConcepts}
              onChange={(event) => setIncludeConcepts(event.target.checked)}
            />
            Include matching concepts
          </label>
        </div>
        <p className={styles.stats}>
          {graph.stats.recurringTopicCount} recurring topics ·{' '}
          {graph.stats.recurringCount} matching labels ·{' '}
          {graph.stats.pathCount} learning paths
        </p>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
          <div className={styles.split}>
              <div className={styles.stage}>
                <GraphViewport
                  scrollerClassName={lp.mapScroll}
                  padClassName={lp.graphPad}
                  canvasClassName={lp.canvas}
                  canvasStyle={
                    {
                      '--graph-w': `${layout.width}px`,
                      '--graph-h': `${layout.height}px`
                    } as React.CSSProperties
                  }
                  overlay={
                    <div className={styles.legend}>
                      <span className={styles.legendItem}>
                        <span
                          className={`${styles.swatch} ${styles.swatchTopic}`}
                        />
                        Knowledge component
                      </span>
                      <span className={styles.legendItem}>
                        <span
                          className={`${styles.swatch} ${styles.swatchPath}`}
                        />
                        Learning path
                      </span>
                    </div>
                  }
                >
                  <svg
                    className={lp.connections}
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    preserveAspectRatio='xMinYMin meet'
                    aria-hidden
                  >
                    {topics.flatMap((topic) => {
                      const from = layout.positions[topic.id]
                      if (!from) return []
                      return topic.paths.map((path) => {
                        const to =
                          layout.positions[knowledgeGraphPathNodeId(path.slug)]
                        if (!to) return null
                        const active =
                          !focusPathSlugs ||
                          focusPathSlugs.has(path.slug) ||
                          selectedId === topic.id
                        return (
                          <line
                            key={`${topic.id}-${path.slug}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke={active ? '#8ab7cc' : '#d7d8da'}
                            strokeWidth={active ? 1.4 : 0.8}
                          />
                        )
                      })
                    })}
                  </svg>
                  {paths.map((path) => {
                    const id = knowledgeGraphPathNodeId(path.slug)
                    const pos = layout.positions[id]
                    if (!pos) return null
                    const selected = selectedId === id
                    return (
                      <button
                        key={id}
                        type='button'
                        className={`${lp.node} ${styles.nodePath} ${
                          selected ? lp.nodeSelected : ''
                        } ${isDimmed(id, 'path') ? styles.nodeDim : ''}`}
                        style={{ left: pos.x, top: pos.y }}
                        onClick={() =>
                          setSelectedId(selected ? null : id)
                        }
                      >
                        <span className={lp.nodeStatus} />
                        <span className={lp.nodeHead}>
                          <span className={lp.nodeLabel}>{path.title}</span>
                        </span>
                        <span className={lp.nodeSub}>
                          {learningPathKicker(path.kind)}
                        </span>
                      </button>
                    )
                  })}
                  {topics.map((topic) => {
                    const pos = layout.positions[topic.id]
                    if (!pos) return null
                    const selected = selectedId === topic.id
                    return (
                      <button
                        key={topic.id}
                        type='button'
                        className={`${lp.node} ${
                          topic.paths.length > 1 ? styles.nodeRecurring : ''
                        } ${selected ? lp.nodeSelected : ''} ${
                          isDimmed(topic.id, 'topic') ? styles.nodeDim : ''
                        }`}
                        style={{ left: pos.x, top: pos.y }}
                        onClick={() =>
                          setSelectedId(selected ? null : topic.id)
                        }
                      >
                        <span className={lp.nodeStatus} />
                        <span className={lp.nodeHead}>
                          <span className={lp.nodeLabel}>{topic.label}</span>
                        </span>
                        <span className={lp.nodeSub}>
                          {pathCountLabel(topic.paths.length)}
                        </span>
                      </button>
                    )
                  })}
                </GraphViewport>
              </div>

              <aside className={styles.side}>
                {selectedTopic ? (
                  <>
                    <p className={styles.sideEyebrow}>Knowledge component</p>
                    <h2 className={styles.sideTitle}>{selectedTopic.label}</h2>
                    <p className={styles.sideMeta}>
                      Reoccurs in {pathCountLabel(selectedTopic.paths.length)}
                    </p>
                    <ul className={styles.pathList}>
                      {selectedTopic.paths.map((path) => (
                        <li key={path.slug}>
                          <Link href={`/learning-path/${path.slug}`} legacyBehavior>
                            <a className={styles.pathLink}>
                              <span className={styles.pathKicker}>
                                {learningPathKicker(path.kind)}
                              </span>
                              {path.title}
                            </a>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : selectedPath ? (
                  <>
                    <p className={styles.sideEyebrow}>
                      {learningPathKicker(selectedPath.kind)}
                    </p>
                    <h2 className={styles.sideTitle}>{selectedPath.title}</h2>
                    <p className={styles.sideMeta}>
                      Topics on this map that also appear elsewhere
                    </p>
                    <ul className={styles.pathList}>
                      {topics
                        .filter((topic) =>
                          topic.paths.some(
                            (path) => path.slug === selectedPath.slug
                          )
                        )
                        .map((topic) => (
                          <li key={topic.id}>
                            <button
                              type='button'
                              className={styles.pathLink}
                              onClick={() => setSelectedId(topic.id)}
                            >
                              {topic.label}
                              <span className={styles.pathKicker}>
                                {pathCountLabel(topic.paths.length)}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                    <p className={styles.sideMeta}>
                      <Link href={`/learning-path/${selectedPath.slug}`}>
                        Open learning path
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.sideEyebrow}>How to read this</p>
                    <h2 className={styles.sideTitle}>Shared topics</h2>
                    <p className={styles.empty}>
                      White nodes are knowledge components. Blue nodes are
                      learning paths. Click a topic to see every path it appears
                      on. Exact titles match today; similar wording will cluster
                      after the LLM pass.
                    </p>
                    {topics.length === 0 ? (
                      <p className={styles.empty}>
                        No recurring topics for this filter. Try search or
                        include matching concepts.
                      </p>
                    ) : null}
                  </>
                )}
              </aside>
            </div>
        </div>
      </div>
    </section>
  )
}
