import type { PlanSummary } from '../types'

function Lamp({ tone, label, count }: { tone: 'go' | 'caution' | 'stop'; label: string; count: number }) {
  return (
    <div className={`lamp lamp-${tone}${count > 0 ? ' lamp-lit' : ''}`}>
      <span className="lamp-bulb" />
      <span className="lamp-count">{count}</span>
      <span className="lamp-label">{label}</span>
    </div>
  )
}

export default function SummaryBar({ summary, terraformVersion }: { summary: PlanSummary; terraformVersion: string }) {
  return (
    <div className="summary-bar">
      <span className="brand">preflight</span>
      <div className="lamp-strip">
        <Lamp tone="go" label="ADD" count={summary.add} />
        <Lamp tone="caution" label="CHANGE" count={summary.change} />
        <Lamp tone="stop" label="DESTROY" count={summary.destroy} />
      </div>
      <span className="tf-version">terraform {terraformVersion}</span>
    </div>
  )
}
