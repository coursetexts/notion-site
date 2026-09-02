import type { KnowledgeGraphViewEdge } from '@/lib/knowledge-graph'

const NODE_W = 180
const NODE_H = 68
const H_GAP = 40
const V_GAP = 56
const PAD_X = 48
const PAD_Y = 36
const COMPONENT_GAP = 72

export type KnowledgeGraphLayoutNode = {
  id: string
  label: string
}

export type KnowledgeGraphLayout = {
  width: number
  height: number
  positions: Record<string, { x: number; y: number }>
}

function connectedComponents(
  nodeIds: string[],
  edges: KnowledgeGraphViewEdge[]
): string[][] {
  const allowed = new Set(nodeIds)
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) adj.set(id, [])
  for (const edge of edges) {
    if (!allowed.has(edge.fromId) || !allowed.has(edge.toId)) continue
    adj.get(edge.fromId)?.push(edge.toId)
    adj.get(edge.toId)?.push(edge.fromId)
  }
  const seen = new Set<string>()
  const components: string[][] = []
  for (const id of nodeIds) {
    if (seen.has(id)) continue
    const queue = [id]
    seen.add(id)
    const group: string[] = []
    while (queue.length) {
      const current = queue.shift() as string
      group.push(current)
      for (const next of adj.get(current) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    components.push(group)
  }
  return components
}

function placeCircle(ids: string[], cx: number, cy: number, radius: number) {
  const positions: Record<string, { x: number; y: number }> = {}
  if (ids.length === 1) {
    positions[ids[0]] = { x: cx, y: cy }
    return positions
  }
  ids.forEach((id, index) => {
    const angle = (Math.PI * 2 * index) / ids.length - Math.PI / 2
    positions[id] = {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    }
  })
  return positions
}

/**
 * Connected components as circles, isolated topics in a wrapping row.
 * Does not use the learning-path tree layout (that assumes a goal).
 */
export function layoutKnowledgeGraph(
  nodes: KnowledgeGraphLayoutNode[],
  edges: KnowledgeGraphViewEdge[]
): KnowledgeGraphLayout {
  const ids = nodes.map((node) => node.id)
  const components = connectedComponents(ids, edges).sort(
    (a, b) => b.length - a.length
  )
  const positions: Record<string, { x: number; y: number }> = {}
  let cursorY = PAD_Y + NODE_H / 2
  let maxX = 720

  for (const group of components) {
    if (group.length === 1) continue
    const radius = Math.max(70, (group.length * (NODE_W + 12)) / (2 * Math.PI))
    const cx = PAD_X + Math.max(NODE_W / 2 + 24, radius + NODE_W / 2)
    const cy = cursorY + radius
    Object.assign(positions, placeCircle(group, cx, cy, radius))
    maxX = Math.max(maxX, cx + radius + NODE_W / 2 + PAD_X)
    cursorY = cy + radius + NODE_H / 2 + COMPONENT_GAP
  }

  const isolated = components.filter((group) => group.length === 1).map((g) => g[0])
  const colCount = Math.max(1, Math.floor((Math.max(720, maxX) - PAD_X * 2) / (NODE_W + H_GAP)))
  isolated.forEach((id, index) => {
    const col = index % colCount
    const row = Math.floor(index / colCount)
    positions[id] = {
      x: PAD_X + NODE_W / 2 + col * (NODE_W + H_GAP),
      y: cursorY + row * (NODE_H + V_GAP)
    }
    maxX = Math.max(maxX, positions[id].x + NODE_W / 2 + PAD_X)
  })
  const isolatedRows = isolated.length === 0 ? 0 : Math.ceil(isolated.length / colCount)
  const isolatedHeight =
    isolatedRows === 0 ? 0 : isolatedRows * (NODE_H + V_GAP) - V_GAP + NODE_H / 2
  const height = Math.max(420, cursorY + isolatedHeight + PAD_Y)
  return { width: Math.max(720, maxX), height, positions }
}
