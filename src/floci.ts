import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const START_TIMEOUT_MS = 60_000

export async function checkFlociInstalled(): Promise<boolean> {
  try {
    await execFileAsync('floci', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function isFlociRunning(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('floci', ['status'])
    return /Reachable:\s*yes/i.test(stdout)
  } catch {
    return false
  }
}

/** Starts Floci if it isn't already running. Returns whether this call started it. */
export async function startFloci(): Promise<boolean> {
  if (await isFlociRunning()) return false
  await execFileAsync('floci', ['start'], { timeout: START_TIMEOUT_MS })
  return true
}

export async function stopFloci(): Promise<void> {
  await execFileAsync('floci', ['stop'])
}

/** Polls a Floci health endpoint until it responds ok, for when Floci is managed externally
 * (e.g. as a sibling Compose service) rather than started by this process. */
export async function waitForFlociReady(healthUrl: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      const res = await fetch(healthUrl)
      if (res.ok) return
      lastError = new Error(`${healthUrl} responded with ${res.status}`)
    } catch (err) {
      lastError = err
    }
    await new Promise((r) => setTimeout(r, 1000))
  }

  throw new Error(`Timed out waiting for Floci at ${healthUrl}: ${lastError}`)
}

export async function getFlociEnv(): Promise<Record<string, string>> {
  const { stdout } = await execFileAsync('floci', ['env'])
  const vars: Record<string, string> = {}

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    vars[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1')
  }

  return vars
}
