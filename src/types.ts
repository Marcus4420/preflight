// Subset of Terraform's `terraform show -json <planfile>` schema.
// https://developer.hashicorp.com/terraform/internals/json-format
export interface TerraformPlanJson {
  format_version: string
  terraform_version: string
  resource_changes?: TerraformResourceChange[]
}

export type TerraformAction = 'no-op' | 'create' | 'read' | 'update' | 'delete'

export interface TerraformResourceChange {
  address: string
  mode: string
  type: string
  name: string
  provider_name: string
  change: {
    actions: TerraformAction[]
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
  }
}

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
