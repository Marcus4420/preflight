import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from './buildGraph'
import { iconForResourceType } from './icons'

type ResourceNodeType = Node<GraphNodeData>

const ACTION_LABEL: Record<GraphNodeData['action'], string> = {
  create: 'ADD',
  update: 'CHANGE',
  delete: 'DESTROY',
  replace: 'REPLACE',
  'no-op': 'NO-OP',
}

export default function ResourceNode({ data }: NodeProps<ResourceNodeType>) {
  const Icon = iconForResourceType(data.resourceType)

  return (
    <div className={`resource-node action-${data.action}`}>
      <Handle type="target" position={Position.Left} />
      <div className="resource-node-icon">
        <Icon width={16} height={16} />
      </div>
      <div className="resource-node-body">
        <span className="resource-node-type">{data.resourceType}</span>
        <span className="resource-node-name">{data.label.split('.').slice(1).join('.')}</span>
      </div>
      <span className="resource-node-lamp" title={ACTION_LABEL[data.action]} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
