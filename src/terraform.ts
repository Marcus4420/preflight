import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlanAction, PlanEdge, PlanNode, PlanResult, TerraformPlanJson } from './types.js'

const execFileAsync = promisify(execFile)
const MAX_BUFFER = 1024 * 1024 * 64

async function run(cwd: string, env: NodeJS.ProcessEnv, args: string[]) {
  return execFileAsync('terraform', args, { cwd, env, maxBuffer: MAX_BUFFER })
}

export async function ensureInitialized(cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  if (existsSync(join(cwd, '.terraform'))) return
  await run(cwd, env, ['init', '-input=false'])
}

function actionsToPlanAction(actions: readonly string[]): PlanAction {
  if (actions.length === 2) return 'replace'
  switch (actions[0]) {
    case 'create':
      return 'create'
    case 'update':
      return 'update'
    case 'delete':
      return 'delete'
    default:
      return 'no-op'
  }
}

function stripGraphLabel(raw: string): string {
  return raw
    .replace(/\\"/g, '"')
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/\s*\((expand|close|destroy)\)$/, '')
    .trim()
}

function parseGraphEdges(dot: string, knownIds: Set<string>): PlanEdge[] {
  const edgeLine = /"([^"]+)"\s*->\s*"([^"]+)"/g
  const seen = new Set<string>()
  const edges: PlanEdge[] = []

  for (const match of dot.matchAll(edgeLine)) {
    const source = stripGraphLabel(match[1])
    const target = stripGraphLabel(match[2])
    if (source === target) continue
    if (!knownIds.has(source) || !knownIds.has(target)) continue
    const key = `${source}=>${target}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push({ source, target })
  }

  return edges
}

export async function runPlan(cwd: string, env: NodeJS.ProcessEnv): Promise<PlanResult> {
  await ensureInitialized(cwd, env)

  const planFile = join(cwd, 'preflight.tfplan')
  await run(cwd, env, ['plan', '-input=false', `-out=${planFile}`])

  try {
    const { stdout: planJsonRaw } = await run(cwd, env, ['show', '-json', planFile])
    const plan: TerraformPlanJson = JSON.parse(planJsonRaw)

    const resourceChanges = plan.resource_changes ?? []
    const nodes: PlanNode[] = resourceChanges.map((rc) => ({
      id: rc.address,
      resourceType: rc.type,
      name: rc.name,
      action: actionsToPlanAction(rc.change.actions),
      before: rc.change.before,
      after: rc.change.after,
    }))

    const summary = nodes.reduce(
      (acc, node) => {
        if (node.action === 'create') acc.add += 1
        else if (node.action === 'update') acc.change += 1
        else if (node.action === 'delete') acc.destroy += 1
        else if (node.action === 'replace') {
          acc.add += 1
          acc.destroy += 1
        }
        return acc
      },
      { add: 0, change: 0, destroy: 0 },
    )

    const { stdout: dot } = await run(cwd, env, ['graph', '-type=plan'])
    const knownIds = new Set(nodes.map((n) => n.id))
    const edges = parseGraphEdges(dot, knownIds)

    return {
      terraformVersion: plan.terraform_version,
      summary,
      nodes,
      edges,
    }
  } finally {
    if (existsSync(planFile)) await unlink(planFile)
  }
}
