import * as React from 'react'

import {
  courseLearningPathToGraphData,
  layoutMentalMapGraph,
  MENTAL_MAP_GOAL_ID
} from '@/lib/course-learning-path-graph'
import type { CourseLearningPathData } from '@/lib/course-learning-path-types'
import { edgePath, visibleTree, type PathTreeItem } from '@/lib/learning-path-graph-layout'
import {
  sequenceMarks,
  type LearningPathNode
} from '@/lib/learning-path-seed'

import lp from './LearningPath.module.css'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useAnimatedPositions(
  targets: Record<string, { x: number; y: number }>,
  enabled: boolean
) {
  const [current, setCurrent] = React.useState(targets)
  const currentRef = React.useRef(targets)
  const rafRef = React.useRef(0)

  React.useEffect(() => {
    if (!enabled) {
      currentRef.current = targets
      setCurrent(targets)
      return
    }
    const from = { ...currentRef.current }
    const start = performance.now()
    const duration = 580
    const ease = (t: number) => 1 - Math.pow(1 - t, 4)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = ease(t)
      const next: Record<string, { x: number; y: number }> = {}
      const ids = new Set([...Object.keys(from), ...Object.keys(targets)])
      for (const id of ids) {
        const end = targets[id]
        const begin = from[id] ?? end
        if (!end) continue
        next[id] = {
          x: begin.x + (end.x - begin.x) * e,
          y: begin.y + (end.y - begin.y) * e
        }
      }
      currentRef.current = next
      setCurrent(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targets, enabled])

  return current
}

function nodeClass(node: LearningPathNode, selected: boolean) {
  const parts = [lp.node]
  if (selected) parts.push(lp.nodeSelected)
  if (node.kind === 'goal') parts.push(lp.nodeGoal)
  if (node.kind === 'milestone') parts.push(lp.nodeMilestone)
  if (node.status === 'explored') parts.push(lp.nodeExplored)
  if (node.status === 'exploring') parts.push(lp.nodeExploring)
  return parts.join(' ')
}

function PathLegend() {
  return (
    <div className={lp.legend}>
      <span>
        <i className={`${lp.legendDot} ${lp.legendExplored}`} /> Explored
      </span>
      <span>
        <i className={`${lp.legendDot} ${lp.legendExploring}`} /> Exploring
      </span>
      <span>
        <i className={`${lp.legendDot} ${lp.legendNext}`} /> Next
      </span>
    </div>
  )
}

function PathOutlineList({
  items,
  marks,
  selectedId,
  onSelect
}: {
  items: PathTreeItem[]
  marks: ReturnType<typeof sequenceMarks>
  selectedId: string
  onSelect: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <ul className={lp.pathList}>
      {items.map((item) => {
        const mark = marks[item.node.id]
        const selected = item.node.id === selectedId
        return (
          <li key={item.node.id} className={lp.pathListItem}>
            <button
              type='button'
              className={
                selected
                  ? `${lp.pathListRow} ${lp.pathListRowSelected}`
                  : lp.pathListRow
              }
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(item.node.id)}
            >
              <i
                className={[
                  lp.pathListDot,
                  item.node.status === 'explored'
                    ? lp.legendExplored
                    : item.node.status === 'exploring'
                      ? lp.legendExploring
                      : lp.legendNext
                ].join(' ')}
                aria-hidden
              />
              {mark ? (
                <span
                  className={
                    mark.role === 'branch'
                      ? `${lp.nodeMark} ${lp.nodeMarkBranch}`
                      : lp.nodeMark
                  }
                >
                  {mark.role === 'branch' ? `${mark.mark})` : mark.mark}
                </span>
              ) : item.node.kind === 'goal' ? (
                <span className={lp.pathListGoalMark}>Goal</span>
              ) : (
                <span className={lp.nodeMark} />
              )}
              <span className={lp.pathListCopy}>
                <span className={lp.pathListLabel}>{item.node.label}</span>
                <span className={lp.pathListMeta}>
                  {item.node.kind === 'goal'
                    ? item.node.sub || 'The course'
                    : item.node.sub}
                </span>
              </span>
            </button>
            {item.children.length > 0 ? (
              <PathOutlineList
                items={item.children}
                marks={marks}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

type PathGraphCanvasProps = {
  course: CourseLearningPathData
  exploredIds: Set<string>
  onOpenNode: (id: string) => void
}

export function PathGraphCanvas({
  course,
  exploredIds,
  onOpenNode
}: PathGraphCanvasProps) {
  const path = React.useMemo(
    () => courseLearningPathToGraphData(course, exploredIds),
    [course, exploredIds]
  )
  const [viewMode, setViewMode] = React.useState<'graph' | 'list'>('graph')
  const [focusId, setFocusId] = React.useState(MENTAL_MAP_GOAL_ID)
  const reduceMotion = usePrefersReducedMotion()

  React.useEffect(() => {
    setFocusId(MENTAL_MAP_GOAL_ID)
  }, [course.id])

  const layout = React.useMemo(
    () => layoutMentalMapGraph(path, focusId),
    [path, focusId]
  )
  const displayPositions = useAnimatedPositions(
    layout.positions,
    !reduceMotion
  )
  const marks = React.useMemo(() => sequenceMarks(path), [path])
  const tree = React.useMemo(
    () => visibleTree(path, path.nodes),
    [path]
  )

  function handleSelect(id: string) {
    setFocusId(id)
    if (id !== MENTAL_MAP_GOAL_ID) onOpenNode(id)
  }

  if (course.topics.length === 0) {
    return (
      <p className={lp.pathListEmpty}>
        Syllabus topics will appear on this map once they are added.
      </p>
    )
  }

  return (
    <section
      className={lp.mapPanel}
      aria-label='Course map'
      style={{
        borderRight: 'none',
        minWidth: viewMode === 'graph' ? layout.width : undefined
      }}
    >
      <div className={lp.mapToolbar}>
        <div className={lp.mapToolbarCopy}>
          <h2 className={lp.mapTitle}>
            {viewMode === 'list' ? 'The outline' : 'The map'}
          </h2>
          <span className={lp.mapHint}>
            {viewMode === 'list'
              ? 'Select a topic to open it'
              : 'Hover a topic to see its children · click a node to open it'}
          </span>
        </div>
        <div className={lp.viewToggle} role='group' aria-label='Map view'>
          <button
            type='button'
            className={lp.viewToggleBtn}
            aria-pressed={viewMode === 'graph'}
            onClick={() => setViewMode('graph')}
          >
            Graph
          </button>
          <button
            type='button'
            className={lp.viewToggleBtn}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className={lp.pathListWrap}>
          <div className={lp.pathListScroll}>
            <PathOutlineList
              items={tree}
              marks={marks}
              selectedId={focusId}
              onSelect={handleSelect}
            />
          </div>
          <div className={lp.pathListFooter}>
            <PathLegend />
          </div>
        </div>
      ) : (
        <div
          className={lp.canvas}
          style={{
            minHeight: layout.height,
            minWidth: layout.width,
            height: layout.height,
            width: layout.width
          }}
          onMouseLeave={() => setFocusId(MENTAL_MAP_GOAL_ID)}
        >
          <svg
            className={lp.connections}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio='none'
            aria-hidden
            style={{ inset: 0, width: '100%', height: '100%' }}
          >
            {path.edges.map((edge) => {
              if (
                !layout.visibleIds.has(edge.from) ||
                !layout.visibleIds.has(edge.to)
              ) {
                return null
              }
              const fromPos = displayPositions[edge.from]
              const toPos = displayPositions[edge.to]
              if (!fromPos || !toPos) return null
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={edgePath(fromPos, toPos)}
                  style={{ strokeWidth: 1.4 }}
                />
              )
            })}
          </svg>
          {path.nodes.map((node) => {
            if (!layout.visibleIds.has(node.id)) return null
            const mark = marks[node.id]
            const pos = displayPositions[node.id] ?? layout.positions[node.id]
            if (!pos) return null
            return (
              <button
                key={node.id}
                type='button'
                className={nodeClass(node, node.id === focusId)}
                style={{ left: pos.x, top: pos.y }}
                aria-label={
                  mark
                    ? mark.role === 'core'
                      ? `Topic ${mark.mark}: ${node.label}`
                      : `${node.label}, ${mark.mark})`
                    : node.label
                }
                onMouseEnter={() => setFocusId(node.id)}
                onFocus={() => setFocusId(node.id)}
                onClick={() => handleSelect(node.id)}
              >
                <span className={lp.nodeStatus} />
                <span className={lp.nodeHead}>
                  {mark ? (
                    <span
                      className={
                        mark.role === 'branch'
                          ? `${lp.nodeMark} ${lp.nodeMarkBranch}`
                          : lp.nodeMark
                      }
                    >
                      {mark.role === 'branch' ? `${mark.mark})` : mark.mark}
                    </span>
                  ) : null}
                  <span className={lp.nodeLabel}>{node.label}</span>
                </span>
                <span className={lp.nodeSub}>{node.sub}</span>
              </button>
            )
          })}
          <PathLegend />
        </div>
      )}
    </section>
  )
}
