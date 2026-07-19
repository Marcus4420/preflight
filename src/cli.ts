#!/usr/bin/env node
import open from 'open'
import { checkFlociInstalled, startFloci, stopFloci, getFlociEnv, waitForFlociReady } from './floci.js'
import { runPlan } from './terraform.js'
import { startServer } from './server.js'
import { exportStaticSite } from './staticExport.js'

const USAGE = `Usage: terraform-preflight [options]

Runs "terraform plan" against a local Floci emulator and visualizes the result.
Run it from a directory containing your Terraform configuration.

Options:
  --ci           Headless mode for CI: write a static report instead of starting
                 a server, and exit 1 if the plan contains any changes.
  --out <dir>    Where --ci writes the report (default: preflight-report)
  -h, --help     Show this help.

Environment variables:
  PREFLIGHT_EXTERNAL_FLOCI     Floci is managed externally (e.g. Docker Compose);
                               wait for it instead of starting it.
  PREFLIGHT_FLOCI_HEALTH_URL   Health endpoint to poll in external mode
                               (default: http://localhost:4566/_floci/health)
  PREFLIGHT_NO_OPEN            Don't open the browser automatically.`

function parseCliOptions(argv: string[]): { ci: boolean; outDir: string } {
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(USAGE)
    process.exit(0)
  }

  const unknown = argv.filter((arg, i) => {
    if (arg === '--ci' || arg === '--out') return false
    if (argv[i - 1] === '--out') return false
    return true
  })
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown[0]}\n\n${USAGE}`)
    process.exit(2)
  }

  const outFlagIndex = argv.indexOf('--out')
  const outDir = outFlagIndex !== -1 ? argv[outFlagIndex + 1] : 'preflight-report'
  if (outFlagIndex !== -1 && (!outDir || outDir.startsWith('--'))) {
    console.error(`--out requires a directory argument\n\n${USAGE}`)
    process.exit(2)
  }

  return { ci: argv.includes('--ci'), outDir }
}

const EXTERNAL_FLOCI = Boolean(process.env.PREFLIGHT_EXTERNAL_FLOCI)
const NO_OPEN = Boolean(process.env.PREFLIGHT_NO_OPEN)
const options = parseCliOptions(process.argv.slice(2))

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

/** Builds the environment terraform runs with, guaranteeing it can only ever talk to the
 * emulator. Any real AWS credentials present in the surrounding environment (common on CI
 * runners that also run apply jobs) are replaced with dummies, and an emulator endpoint is
 * required — otherwise terraform would silently plan against real AWS. */
function emulatorOnlyEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (!base.AWS_ENDPOINT_URL) {
    throw new Error(
      'AWS_ENDPOINT_URL is not set, so terraform would talk to real AWS. ' +
        'Point it at the Floci emulator (e.g. http://localhost:4566).',
    )
  }

  const env = { ...base }
  delete env.AWS_PROFILE
  delete env.AWS_SESSION_TOKEN
  env.AWS_ACCESS_KEY_ID = 'test'
  env.AWS_SECRET_ACCESS_KEY = 'test'
  return env
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
    const env = emulatorOnlyEnv(
      EXTERNAL_FLOCI ? { ...process.env } : { ...process.env, ...(await getFlociEnv()) },
    )

    console.log('Running terraform plan...')
    const plan = await runPlan(cwd, env)
    console.log(`Plan: ${plan.summary.add} to add, ${plan.summary.change} to change, ${plan.summary.destroy} to destroy.`)

    if (options.ci) {
      await exportStaticSite(plan, options.outDir)
      console.log(`Report written to ${options.outDir}/ (open ${options.outDir}/index.html for the graph).`)
      await teardown()
      const hasChanges = plan.summary.add + plan.summary.change + plan.summary.destroy > 0
      process.exitCode = hasChanges ? 1 : 0
      return
    }

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
