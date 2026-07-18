import type { ReactElement } from 'react'
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBlockValue(value: unknown): boolean {
  if (isPlainObject(value)) return true
  if (Array.isArray(value)) return value.length > 0 && value.some((v) => typeof v === 'object' && v !== null)
  return false
}

function formatPorts(rule: Record<string, unknown>): string | null {
  const from = rule.from_port
  const to = rule.to_port
  if (typeof from !== 'number' || typeof to !== 'number') return null
  if (from === 0 && to === 0) return 'all ports'
  if (from === to) return `port ${from}`
  return `ports ${from}-${to}`
}

function formatProtocol(protocol: unknown): string {
  if (protocol === '-1' || protocol === -1) return 'all protocols'
  if (typeof protocol === 'string') return protocol.toUpperCase()
  return String(protocol)
}

function formatSources(rule: Record<string, unknown>): string {
  const sources: string[] = []
  for (const field of ['cidr_blocks', 'ipv6_cidr_blocks', 'prefix_list_ids', 'security_groups'] as const) {
    const list = rule[field]
    if (Array.isArray(list) && list.length > 0) sources.push(...list.map(String))
  }
  if (rule.self === true) sources.push('self')
  return sources.length > 0 ? sources.join(', ') : 'nowhere'
}

function isSecurityRule(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && ('from_port' in value || 'to_port' in value) && 'protocol' in value
}

function RuleCard({ rule }: { rule: Record<string, unknown> }) {
  const ports = formatPorts(rule)
  const protocol = formatProtocol(rule.protocol)
  const sources = formatSources(rule)
  const description = typeof rule.description === 'string' && rule.description ? rule.description : null

  return (
    <div className="diff-rule">
      <span className="diff-rule-summary">
        {ports ? `${ports} · ` : ''}
        {protocol} from {sources}
      </span>
      {description && <span className="diff-rule-desc">{description}</span>}
    </div>
  )
}

function ValueView({ value }: { value: unknown }): ReactElement {
  if (value === null || value === undefined) return <span className="diff-empty-value">null</span>
  if (typeof value === 'string') return <span className="diff-value">{value}</span>
  if (typeof value !== 'object') return <span className="diff-value">{String(value)}</span>

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="diff-empty-value">(empty)</span>
    if (value.every(isSecurityRule)) {
      return (
        <div className="diff-rule-list">
          {value.map((rule, i) => (
            <RuleCard key={i} rule={rule as Record<string, unknown>} />
          ))}
        </div>
      )
    }
    if (value.every((v) => typeof v !== 'object' || v === null)) {
      return <span className="diff-value">{value.map(String).join(', ')}</span>
    }
    return (
      <div className="diff-nested">
        {value.map((item, i) => (
          <div key={i} className="diff-nested-item">
            <ValueView value={item} />
          </div>
        ))}
      </div>
    )
  }

  return <NestedObjectView obj={value as Record<string, unknown>} />
}

function NestedObjectView({ obj }: { obj: Record<string, unknown> }) {
  return (
    <div className="diff-nested">
      {Object.keys(obj)
        .sort()
        .map((key) => (
          <div key={key} className="diff-row">
            <span className="diff-key">{key}</span>
            <ValueView value={obj[key]} />
          </div>
        ))}
    </div>
  )
}

function ObjectView({ obj, changedKeys }: { obj: Record<string, unknown> | null; changedKeys: Set<string> }) {
  if (!obj) return <p className="diff-empty-value">(none)</p>
  return (
    <div className="diff-block">
      {Object.keys(obj)
        .sort()
        .map((key) => (
          <div
            key={key}
            className={
              (changedKeys.has(key) ? 'diff-row diff-row-changed' : 'diff-row') +
              (isBlockValue(obj[key]) ? ' diff-row-block' : '')
            }
          >
            <span className="diff-key">{key}</span>
            <ValueView value={obj[key]} />
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
