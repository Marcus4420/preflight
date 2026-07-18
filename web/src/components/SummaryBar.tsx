import type { PlanSummary } from '../types'

export default function SummaryBar({ summary, terraformVersion }: { summary: PlanSummary; terraformVersion: string }) {
  return (
    <div className="summary-bar">
      <span className="brand">preflight</span>
      <span className="pill add">{summary.add} to add</span>
      <span className="pill change">{summary.change} to change</span>
      <span className="pill destroy">{summary.destroy} to destroy</span>
      <span style={{ marginLeft: 'auto', color: '#565b66' }}>terraform {terraformVersion}</span>
    </div>
  )
}
