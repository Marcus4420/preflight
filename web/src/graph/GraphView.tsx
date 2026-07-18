import { useEffect, useState } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { PlanResult } from '../types'
import { buildGraph, type GraphNodeData } from './buildGraph'
import ResourceNode from './ResourceNode'
import PlanEdge from './PlanEdge'

const nodeTypes = { resource: ResourceNode }
const edgeTypes = { plan: PlanEdge }

interface GraphViewProps {
  plan: PlanResult
  onSelect: (id: string | null) => void
}

export default function GraphView({ plan, onSelect }: GraphViewProps) {
  const [graph, setGraph] = useState<{ nodes: Node<GraphNodeData>[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  })

  useEffect(() => {
    let cancelled = false
    buildGraph(plan).then((result) => {
      if (!cancelled) setGraph(result)
    })
    return () => {
      cancelled = true
    }
  }, [plan])

  const { nodes, edges } = graph

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      colorMode="dark"
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_event, node: Node<GraphNodeData>) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
    >
      <Background variant={BackgroundVariant.Dots} color="#1a2129" gap={22} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
