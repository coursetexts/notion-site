import type {
  LearningPathData,
  LearningPathNode
} from '@/lib/learning-path-seed'

export type PathTreeItem = {
  node: LearningPathNode
  children: PathTreeItem[]
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function sortTreeNodes(a: LearningPathNode, b: LearningPathNode) {
  const as = a.sequence ?? a.x
  const bs = b.sequence ?? b.x
  if (as !== bs) return as - bs
  return a.x - b.x
}

export function isCoreStep(node: LearningPathNode) {
  return node.kind === 'concept' || node.kind === 'milestone'
}

export function parentMap(path: LearningPathData) {
  const parentOf = new Map<string, string>()
  for (const edge of path.edges) {
    if (!parentOf.has(edge.to)) parentOf.set(edge.to, edge.from)
  }
  return parentOf
}

export function expandedParents(path: LearningPathData, selectedId: string) {
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  const parentOf = parentMap(path)
  const expanded = new Set<string>([selectedId])
  let current = selectedId
  const seen = new Set<string>()
  while (current && !seen.has(current)) {
    seen.add(current)
    const node = byId[current]
    const parentId = parentOf.get(current)
    if (node?.kind === 'prerequisite' && parentId) expanded.add(parentId)
    current = parentId ?? ''
  }
  return expanded
}

export function graphLayout(
  path: LearningPathData,
  selectedId: string,
  visibleIds: Set<string>
) {
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  const parentOf = parentMap(path)
  const expanded = expandedParents(path, selectedId)
  const childrenOf = new Map<string, LearningPathNode[]>()
  for (const edge of path.edges) {
    if (!visibleIds.has(edge.to) || !visibleIds.has(edge.from)) continue
    const child = byId[edge.to]
    if (!child) continue
    const list = childrenOf.get(edge.from) ?? []
    if (!list.some((node) => node.id === child.id)) list.push(child)
    childrenOf.set(edge.from, list)
  }
  for (const [id, list] of childrenOf) {
    childrenOf.set(id, [...list].sort(sortTreeNodes))
  }

  const positions: Record<string, { x: number; y: number }> = {}
  for (const node of path.nodes) {
    if (!visibleIds.has(node.id)) continue
    positions[node.id] = { x: node.x, y: node.y }
  }

  function visit(parentId: string, seen: Set<string>) {
    if (seen.has(parentId) || !positions[parentId]) return
    seen.add(parentId)
    const children = childrenOf.get(parentId) ?? []
    const branch = children.filter((node) => node.kind === 'prerequisite')
    if (branch.length > 0) {
      const open = expanded.has(parentId)
      const n = branch.length
      const px = positions[parentId].x
      const py = positions[parentId].y
      branch.forEach((child, index) => {
        if (open) {
          const gap = n === 1 ? 0 : Math.min(24, Math.max(14, 48 / (n - 1)))
          positions[child.id] = {
            x: clamp(px + (index - (n - 1) / 2) * gap, 12, 88),
            y: clamp(py + 18, 16, 90)
          }
        } else {
          positions[child.id] = {
            x: clamp(px + (index - (n - 1) / 2) * 1.6, 12, 88),
            y: clamp(py + 8 + index * 1.2, 16, 90)
          }
        }
      })
    }
    for (const child of children) visit(child.id, seen)
  }

  const childIds = new Set(
    path.edges
      .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
      .map((edge) => edge.to)
  )
  const seen = new Set<string>()
  for (const node of path.nodes) {
    if (visibleIds.has(node.id) && !childIds.has(node.id)) {
      visit(node.id, seen)
    }
  }

  return { positions, expanded, parentOf }
}

export function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const midY = (from.y + to.y) / 2
  return `M${from.x} ${from.y} C${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`
}

/** Outline tree: core steps are siblings under the goal, not a chain. */
export function visibleTree(
  path: LearningPathData,
  visible: LearningPathNode[]
): PathTreeItem[] {
  const visibleIds = new Set(visible.map((node) => node.id))
  const childrenOf = new Map<string, LearningPathNode[]>()
  const assigned = new Set<string>()
  const goalId = visible.find((node) => node.kind === 'goal')?.id

  for (const edge of path.edges) {
    if (!visibleIds.has(edge.to) || assigned.has(edge.to)) continue
    const child = path.nodes.find((node) => node.id === edge.to)
    if (!child) continue
    let parentId = edge.from
    const seen = new Set<string>()
    while (parentId && !visibleIds.has(parentId) && !seen.has(parentId)) {
      seen.add(parentId)
      const incoming = path.edges.find((item) => item.to === parentId)
      parentId = incoming?.from ?? ''
    }
    let key = parentId && visibleIds.has(parentId) ? parentId : '__root__'
    const parent =
      key !== '__root__' ? path.nodes.find((node) => node.id === key) : null
    if (isCoreStep(child) && parent && parent.kind !== 'goal') {
      key = goalId && visibleIds.has(goalId) ? goalId : '__root__'
    }
    const list = childrenOf.get(key) ?? []
    list.push(child)
    childrenOf.set(key, list)
    assigned.add(child.id)
  }

  function branch(node: LearningPathNode): PathTreeItem {
    const kids = [...(childrenOf.get(node.id) ?? [])].sort(sortTreeNodes)
    return { node, children: kids.map(branch) }
  }

  const hanging = childrenOf.get('__root__') ?? []
  const roots = [
    ...visible.filter((node) => !assigned.has(node.id)),
    ...hanging
  ]
    .filter(
      (node, index, list) =>
        list.findIndex((item) => item.id === node.id) === index
    )
    .sort((a, b) => {
      if (a.kind === 'goal') return -1
      if (b.kind === 'goal') return 1
      return sortTreeNodes(a, b)
    })

  return roots.map(branch)
}

const NODE_W = 180
const NODE_H = 68
const H_GAP = 32
const V_GAP = 56
const PAD_X = 48
const PAD_Y = 36
const LEGEND_H = 52

function strideX() {
  return NODE_W + H_GAP
}

function prerequisiteChildren(
  path: LearningPathData,
  parentOf: Map<string, string>
) {
  const map = new Map<string, LearningPathNode[]>()
  const byId = Object.fromEntries(path.nodes.map((node) => [node.id, node]))
  for (const edge of path.edges) {
    const child = byId[edge.to]
    if (!child || child.kind !== 'prerequisite') continue
    if (parentOf.get(child.id) !== edge.from) continue
    const list = map.get(edge.from) ?? []
    if (!list.some((node) => node.id === child.id)) list.push(child)
    map.set(edge.from, list)
  }
  for (const [id, list] of map) {
    map.set(id, [...list].sort(sortTreeNodes))
  }
  return map
}

export type HoverGraphLayout = {
  width: number
  height: number
  positions: Record<string, { x: number; y: number }>
  visibleIds: Set<string>
  parentOf: Map<string, string>
  expanded: Set<string>
}

/**
 * Pixel map used by learning paths and the course mental map.
 * Core steps stay in one row; hovered children fan out on the row below
 * without pushing later siblings aside.
 */
export function layoutHoverGraph(
  path: LearningPathData,
  focusId: string,
  allowedIds?: Set<string>
): HoverGraphLayout {
  const allowed = (id: string) => !allowedIds || allowedIds.has(id)
  const parentOf = parentMap(path)
  const expanded = expandedParents(path, focusId)
  const kids = prerequisiteChildren(path, parentOf)
  const core = path.nodes
    .filter((node) => isCoreStep(node) && allowed(node.id))
    .sort(sortTreeNodes)
  const goal = path.nodes.find(
    (node) => node.kind === 'goal' && allowed(node.id)
  )

  const visibleIds = new Set<string>()
  if (goal) visibleIds.add(goal.id)
  for (const node of core) visibleIds.add(node.id)
  for (const node of path.nodes) {
    if (node.kind !== 'prerequisite' || !allowed(node.id)) continue
    const parentId = parentOf.get(node.id)
    if (parentId && expanded.has(parentId) && allowed(parentId)) {
      visibleIds.add(node.id)
    }
  }

  function visibleKids(id: string) {
    return (kids.get(id) ?? []).filter(
      (node) => visibleIds.has(node.id) && node.kind === 'prerequisite'
    )
  }

  const positions: Record<string, { x: number; y: number }> = {}
  const originX = PAD_X + NODE_W / 2
  const goalY = PAD_Y + NODE_H / 2
  const coreY = goalY + NODE_H + V_GAP

  if (goal) {
    positions[goal.id] = { x: originX, y: goalY }
  }

  core.forEach((node, index) => {
    positions[node.id] = {
      x: originX + index * strideX(),
      y: coreY
    }
  })

  let maxX = originX + Math.max(0, core.length - 1) * strideX()
  let maxLevel = 1

  function placeKids(parentId: string, level: number) {
    const parent = positions[parentId]
    if (!parent) return
    const branch = visibleKids(parentId)
    if (branch.length === 0) return

    maxLevel = Math.max(maxLevel, level)
    const y = coreY + (level - 1) * (NODE_H + V_GAP)
    branch.forEach((child, index) => {
      const x = parent.x + index * strideX()
      positions[child.id] = { x, y }
      maxX = Math.max(maxX, x)
    })
    for (const child of branch) {
      placeKids(child.id, level + 1)
    }
  }

  for (const node of core) {
    placeKids(node.id, 2)
  }

  const width = Math.max(720, maxX + NODE_W / 2 + PAD_X)
  const height =
    PAD_Y + maxLevel * (NODE_H + V_GAP) + NODE_H + LEGEND_H + PAD_Y

  return { width, height, positions, visibleIds, parentOf, expanded }
}
