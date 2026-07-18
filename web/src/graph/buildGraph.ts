import ELK, { type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import { MarkerType, type Node, type Edge } from '@xyflow/react'
import type { PlanAction, PlanResult } from '../types'

const NODE_WIDTH = 260
const NODE_HEIGHT = 56

const elk = new ELK()

const ACTION_COLORS: Record<string, string> = {
  create: '#35d488',
  update: '#e0a84a',
  delete: '#ef5350',
  replace: '#ef5350',
  'no-op': '#3d454f',
}

export interface GraphNodeData {
  [key: string]: unknown
  label: string
  resourceType: string
  action: PlanAction
}

export interface GraphEdgeData {
  [key: string]: unknown
  points: { x: number; y: number }[]
}

export async function buildGraph(
  plan: PlanResult,
): Promise<{ nodes: Node<GraphNodeData>[]; edges: Edge[] }> {
  const byId = new Map(plan.nodes.map((n) => [n.id, n]))

  // plan edges point from a resource to its dependency; lay out dependency -> dependent
  const elkEdges: ElkExtendedEdge[] = plan.edges.map((e) => ({
    id: `${e.target}->${e.source}`,
    sources: [e.target],
    targets: [e.source],
  }))

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '96',
      'elk.spacing.nodeNode': '28',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.edgeRouting': 'ORTHOGONAL',
    },
    children: plan.nodes.map((n) => ({ id: n.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: elkEdges,
  }

  const layout = await elk.layout(elkGraph)
  const elkNodeById = new Map((layout.children ?? []).map((n) => [n.id, n]))
  const elkEdgeById = new Map((layout.edges ?? []).map((e) => [e.id, e]))

  const nodes: Node<GraphNodeData>[] = plan.nodes.map((n) => {
    const pos = elkNodeById.get(n.id)
    return {
      id: n.id,
      type: 'resource',
      position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
      data: { label: n.id, resourceType: n.resourceType, action: n.action },
    }
  })

  const edges: Edge[] = plan.edges.map((e) => {
    const action = byId.get(e.source)?.action ?? 'no-op'
    const color = ACTION_COLORS[action] ?? ACTION_COLORS['no-op']
    const id = `${e.target}->${e.source}`
    const elkEdge = elkEdgeById.get(id)
    const section = elkEdge?.sections?.[0]
    const points = section
      ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
      : []

    return {
      id,
      source: e.target,
      target: e.source,
      type: 'plan',
      className: `plan-edge action-${action}`,
      data: { points },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color },
    }
  })

  return { nodes, edges }
}
