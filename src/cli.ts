#!/usr/bin/env node
import open from 'open'
import { checkFlociInstalled, startFloci, stopFloci, getFlociEnv, waitForFlociReady } from './floci.js'
import { runPlan } from './terraform.js'
import { startServer } from './server.js'

const EXTERNAL_FLOCI = Boolean(process.env.PREFLIGHT_EXTERNAL_FLOCI)
const NO_OPEN = Boolean(process.env.PREFLIGHT_NO_OPEN)

/** Gets Floci ready to use and returns a teardown function to call on exit. */
async function ensureFloci(): Promise<() => Promise<void>> {
  if (EXTERNAL_FLOCI) {
    const healthUrl = process.env.PREFLIGHT_FLOCI_HEALTH_URL ?? 'http://localhost:4566/_floci/health'
    console.log(`Waiting for Floci at ${healthUrl}...`)
    await waitForFlociReady(healthUrl)
    return async () => {} // Compose (or whatever started it) owns Floci's lifecycle, not us.
  }

  if (!(await checkFlociInstalled())) {
    throw new Error('floci is not installed. Install it from https://floci.io, then try again.')
  }

  console.log('Starting Floci...')
  const weStartedFloci = await startFloci()
  if (!weStartedFloci) console.log('Floci was already running, leaving it up on exit.')

  return async () => {
    if (!weStartedFloci) return
    console.log('Stopping Floci...')
    await stopFloci().catch(() => {})
  }
}

async function main() {
  const cwd = process.cwd()
  const teardownFloci = await ensureFloci()

  let torndown = false
  const teardown = async () => {
    if (torndown) return
    torndown = true
    await teardownFloci()
  }

  try {
    const env = EXTERNAL_FLOCI ? { ...process.env } : { ...process.env, ...(await getFlociEnv()) }

    console.log('Running terraform plan...')
    const plan = await runPlan(cwd, env)
    console.log(`Plan: ${plan.summary.add} to add, ${plan.summary.change} to change, ${plan.summary.destroy} to destroy.`)

    const { url, close } = await startServer(plan)
    if (NO_OPEN) {
      console.log(`Preflight ready. Open ${url} in your browser.`)
    } else {
      console.log(`Preflight ready: ${url}`)
      await open(url)
    }

    const shutdown = async () => {
      await close()
      await teardown()
      process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (err) {
    await teardown()
    throw err
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
