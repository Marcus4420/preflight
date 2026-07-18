import type { Node, Edge } from '@xyflow/react'
import type { PlanAction, PlanResult } from '../types'

const COLUMN_WIDTH = 280
const ROW_HEIGHT = 110

const ACTION_COLORS: Record<PlanAction, { bg: string; border: string }> = {
  create: { bg: '#0f2f22', border: '#22c55e' },
  update: { bg: '#3a2a10', border: '#f59e0b' },
  delete: { bg: '#3a1414', border: '#ef4444' },
  replace: { bg: '#33210f', border: '#fb923c' },
  'no-op': { bg: '#1f2126', border: '#4b5563' },
}

export interface GraphNodeData {
  label: string
  resourceType: string
  action: PlanAction
  [key: string]: unknown
}

export function buildGraph(plan: PlanResult): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const dependencies = new Map<string, string[]>()
  for (const n of plan.nodes) dependencies.set(n.id, [])
  for (const e of plan.edges) {
    dependencies.get(e.source)?.push(e.target)
  }

  const rankCache = new Map<string, number>()
  function rankOf(id: string, seen: Set<string>): number {
    const cached = rankCache.get(id)
    if (cached !== undefined) return cached
    if (seen.has(id)) return 0
    seen.add(id)
    const deps = dependencies.get(id) ?? []
    const rank = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((d) => rankOf(d, seen)))
    rankCache.set(id, rank)
    return rank
  }

  const rankBuckets = new Map<number, string[]>()
  for (const n of plan.nodes) {
    const rank = rankOf(n.id, new Set())
    if (!rankBuckets.has(rank)) rankBuckets.set(rank, [])
    rankBuckets.get(rank)!.push(n.id)
  }

  const byId = new Map(plan.nodes.map((n) => [n.id, n]))
  const nodes: Node<GraphNodeData>[] = []

  for (const [rank, ids] of [...rankBuckets.entries()].sort((a, b) => a[0] - b[0])) {
    ids.forEach((id, index) => {
      const data = byId.get(id)!
      const colors = ACTION_COLORS[data.action]
      nodes.push({
        id,
        position: { x: rank * COLUMN_WIDTH, y: index * ROW_HEIGHT },
        data: { label: id, resourceType: data.resourceType, action: data.action },
        style: {
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          color: '#e5e7eb',
          fontSize: 12,
          padding: 8,
          width: 240,
        },
      })
    })
  }

  const edges: Edge[] = plan.edges.map((e) => ({
    id: `${e.target}->${e.source}`,
    source: e.target,
    target: e.source,
    style: { stroke: '#4b5563' },
  }))

  return { nodes, edges }
}
