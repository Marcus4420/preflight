import type { PlanNode } from '../types'

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
  if (!obj) return <p style={{ color: '#565b66' }}>(none)</p>
  return (
    <pre>
      {Object.keys(obj)
        .sort()
        .map((key) => (
          <div key={key} className={changedKeys.has(key) ? 'diff-key-changed' : undefined}>
            {key}: {formatValue(obj[key])}
          </div>
        ))}
    </pre>
  )
}

export default function DiffPanel({ node }: { node: PlanNode | null }) {
  if (!node) {
    return (
      <div className="diff-panel">
        <div className="empty">Click a resource to see its diff.</div>
      </div>
    )
  }

  const changed = diffKeys(node.before, node.after)

  return (
    <div className="diff-panel">
      <h2>{node.id}</h2>
      <p className="type">
        {node.resourceType} · {node.action}
      </p>
      <h3>Before</h3>
      <ObjectView obj={node.before} changedKeys={changed} />
      <h3>After</h3>
      <ObjectView obj={node.after} changedKeys={changed} />
    </div>
  )
}
