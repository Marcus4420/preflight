import type { PlanNode } from '../types'
import { iconForResourceType, labelForResourceType } from '../graph/icons'

function diffKeys(before: Record<string, unknown> | null, after: Record<string, unknown> | null): Set<string> {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const changed = new Set<string>()
  for (const key of keys) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) changed.add(key)
  }
  return changed
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function ObjectView({ obj, changedKeys }: { obj: Record<string, unknown> | null; changedKeys: Set<string> }) {
  if (!obj) return <p className="diff-empty-value">(none)</p>
  return (
    <div className="diff-block">
      {Object.keys(obj)
        .sort()
        .map((key) => (
          <div key={key} className={changedKeys.has(key) ? 'diff-row diff-row-changed' : 'diff-row'}>
            <span className="diff-key">{key}</span>
            <span className="diff-value">{formatValue(obj[key])}</span>
          </div>
        ))}
    </div>
  )
}

export default function DiffPanel({ node }: { node: PlanNode | null }) {
  if (!node) {
    return (
      <div className="diff-panel">
        <div className="empty">Select a resource to inspect its diff.</div>
      </div>
    )
  }

  const changed = diffKeys(node.before, node.after)
  const Icon = iconForResourceType(node.resourceType)
  const label = labelForResourceType(node.resourceType)

  return (
    <div className="diff-panel">
      <div className="diff-header">
        <Icon width={18} height={18} />
        <div>
          <h2>{node.id}</h2>
          <p className="type">
            {label} <span className="type-raw">({node.resourceType})</span>{' '}
            <span className={`action-tag action-${node.action}`}>{node.action}</span>
          </p>
        </div>
      </div>
      <h3>Before</h3>
      <ObjectView obj={node.before} changedKeys={changed} />
      <h3>After</h3>
      <ObjectView obj={node.after} changedKeys={changed} />
    </div>
  )
}
