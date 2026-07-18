import { useEffect, useState } from 'react'
import type { PlanNode, PlanResult } from './types'
import SummaryBar from './components/SummaryBar'
import DiffPanel from './components/DiffPanel'
import GraphView from './graph/GraphView'

export default function App() {
  const [plan, setPlan] = useState<PlanResult | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plan')
      .then((res) => res.json())
      .then(setPlan)
  }, [])

  if (!plan) {
    return <div className="app-loading">Loading plan...</div>
  }

  const selectedNode: PlanNode | null = plan.nodes.find((n) => n.id === selectedId) ?? null

  return (
    <div className="app">
      <SummaryBar summary={plan.summary} terraformVersion={plan.terraformVersion} />
      <div className="main-area">
        <div className="graph-area">
          <GraphView plan={plan} onSelect={setSelectedId} />
        </div>
        <DiffPanel node={selectedNode} />
      </div>
    </div>
  )
}
