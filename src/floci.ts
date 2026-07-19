import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ProviderConfig } from './providers.js'

const execFileAsync = promisify(execFile)
const START_TIMEOUT_MS = 60_000

function flociArgs(provider: ProviderConfig, ...args: string[]): string[] {
  return [...provider.flociSubcommand, ...args]
}

export async function checkFlociInstalled(): Promise<boolean> {
  try {
    await execFileAsync('floci', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function isFlociRunning(provider: ProviderConfig): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('floci', flociArgs(provider, 'status'))
    return /Reachable:\s*yes/i.test(stdout)
  } catch {
    return false
  }
}

/** Starts the provider's emulator if it isn't already running. Returns whether this call
 * started it. */
export async function startFloci(provider: ProviderConfig): Promise<boolean> {
  if (await isFlociRunning(provider)) return false
  await execFileAsync('floci', flociArgs(provider, 'start'), { timeout: START_TIMEOUT_MS })
  return true
}

export async function stopFloci(provider: ProviderConfig): Promise<void> {
  await execFileAsync('floci', flociArgs(provider, 'stop'))
}

/** Polls a Floci health endpoint until it responds ok, for when Floci is managed externally
 * (e.g. as a sibling Compose service) rather than started by this process. */
export async function waitForFlociReady(healthUrl: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      // Any non-5xx response counts as ready: not every emulator exposes a health route
      // (floci-gcp 404s on everything), but answering HTTP at all means it's up.
      const res = await fetch(healthUrl)
      if (res.status < 500) return
      lastError = new Error(`${healthUrl} responded with ${res.status}`)
    } catch (err) {
      lastError = err
    }
    await new Promise((r) => setTimeout(r, 1000))
  }

  throw new Error(`Timed out waiting for Floci at ${healthUrl}: ${lastError}`)
}

export async function getFlociEnv(provider: ProviderConfig): Promise<Record<string, string>> {
  const { stdout } = await execFileAsync('floci', flociArgs(provider, 'env'))
  const vars: Record<string, string> = {}

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    vars[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1')
  }

  return vars
}
