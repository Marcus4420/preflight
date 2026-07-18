#!/usr/bin/env node
import open from 'open'
import { checkFlociInstalled, startFloci, stopFloci, getFlociEnv } from './floci.js'
import { runPlan } from './terraform.js'
import { startServer } from './server.js'

async function main() {
  const cwd = process.cwd()

  if (!(await checkFlociInstalled())) {
    console.error('floci is not installed. Install it from https://floci.io, then try again.')
    process.exitCode = 1
    return
  }

  console.log('Starting Floci...')
  const weStartedFloci = await startFloci()
  if (!weStartedFloci) console.log('Floci was already running, leaving it up on exit.')

  let torndown = false
  const teardown = async () => {
    if (torndown) return
    torndown = true
    if (!weStartedFloci) return
    console.log('Stopping Floci...')
    await stopFloci().catch(() => {})
  }

  try {
    const flociEnv = await getFlociEnv()
    const env = { ...process.env, ...flociEnv }

    console.log('Running terraform plan...')
    const plan = await runPlan(cwd, env)
    console.log(`Plan: ${plan.summary.add} to add, ${plan.summary.change} to change, ${plan.summary.destroy} to destroy.`)

    const { url, close } = await startServer(plan)
    console.log(`Preflight ready: ${url}`)
    await open(url)

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
  console.error(err)
  process.exitCode = 1
})
