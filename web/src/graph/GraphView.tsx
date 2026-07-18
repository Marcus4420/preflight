import { useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { PlanResult } from '../types'
import { buildGraph, type GraphNodeData } from './buildGraph'
import ResourceNode from './ResourceNode'

const nodeTypes = { resource: ResourceNode }

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
      nodeTypes={nodeTypes}
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
