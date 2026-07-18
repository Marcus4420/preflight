import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { PlanAction, PlanResult } from '../types'

const NODE_WIDTH = 260
const NODE_HEIGHT = 56

export interface GraphNodeData {
  [key: string]: unknown
  label: string
  resourceType: string
  action: PlanAction
}

export function buildGraph(plan: PlanResult): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 28, ranksep: 96 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of plan.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of plan.edges) {
    // plan edges point from a resource to its dependency; lay out dependency -> dependent (left to right)
    g.setEdge(edge.target, edge.source)
  }

  dagre.layout(g)

  const byId = new Map(plan.nodes.map((n) => [n.id, n]))
  const nodes: Node<GraphNodeData>[] = plan.nodes.map((n) => {
    const pos = g.node(n.id)
    return {
      id: n.id,
      type: 'resource',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: n.id, resourceType: n.resourceType, action: n.action },
    }
  })

  const edges: Edge[] = plan.edges.map((e) => ({
    id: `${e.target}->${e.source}`,
    source: e.target,
    target: e.source,
    type: 'smoothstep',
    className: `plan-edge action-${byId.get(e.source)?.action ?? 'no-op'}`,
  }))

  return { nodes, edges }
}
