// Mirror of the plan types in src/types.ts (the CLI side). Kept as a copy rather than a
// shared package because the shape is small and changes rarely; update both if it does.

export type PlanAction = 'create' | 'update' | 'delete' | 'replace' | 'no-op'

export interface PlanNode {
  id: string
  resourceType: string
  name: string
  action: PlanAction
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export interface PlanEdge {
  source: string
  target: string
}

export interface PlanSummary {
  add: number
  change: number
  destroy: number
}

export interface PlanResult {
  terraformVersion: string
  summary: PlanSummary
  nodes: PlanNode[]
  edges: PlanEdge[]
}
