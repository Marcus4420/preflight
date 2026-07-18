import { useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { PlanResult } from '../types'
import { buildGraph, type GraphNodeData } from './buildGraph'

interface GraphViewProps {
  plan: PlanResult
  onSelect: (id: string | null) => void
}

export default function GraphView({ plan, onSelect }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => buildGraph(plan), [plan])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      colorMode="dark"
      onNodeClick={(_event, node: Node<GraphNodeData>) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
    >
      <Background color="#23262b" gap={20} />
      <Controls />
      <MiniMap pannable zoomable style={{ background: '#14171b' }} />
    </ReactFlow>
  )
}
