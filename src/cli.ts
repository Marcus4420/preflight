#!/usr/bin/env node
import open from 'open'
import { checkFlociInstalled, startFloci, stopFloci, getFlociEnv, waitForFlociReady } from './floci.js'
import { PROVIDERS, detectProvider, scrubCloudCredentials, type ProviderId } from './providers.js'
import { runPlan } from './terraform.js'
import { startServer } from './server.js'
import { exportStaticSite } from './staticExport.js'

const USAGE = `Usage: terraform-preflight [options]

Runs "terraform plan" against a local Floci emulator and visualizes the result.
Run it from a directory containing your Terraform configuration.

Options:
  --provider <aws|azure|gcp>  Which Floci emulator to use. Detected from the
                              Terraform config's provider blocks when omitted.
  --ci                        Headless mode for CI: write a static report instead
                              of starting a server, and exit 1 if the plan
                              contains any changes.
  --out <dir>                 Where --ci writes the report (default: preflight-report)
  -h, --help                  Show this help.

Environment variables:
  PREFLIGHT_EXTERNAL_FLOCI     Floci is managed externally (e.g. Docker Compose);
                               wait for it instead of starting it.
  PREFLIGHT_FLOCI_HEALTH_URL   Health endpoint to poll in external mode
                               (default: the chosen provider's local endpoint)
  PREFLIGHT_NO_OPEN            Don't open the browser automatically.`

interface CliOptions {
  ci: boolean
  outDir: string
  provider: ProviderId | null
}

function parseCliOptions(argv: string[]): CliOptions {
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(USAGE)
    process.exit(0)
  }

  const valueFlags = ['--out', '--provider']
  const unknown = argv.filter((arg, i) => {
    if (arg === '--ci' || valueFlags.includes(arg)) return false
    if (valueFlags.includes(argv[i - 1])) return false
    return true
  })
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown[0]}\n\n${USAGE}`)
    process.exit(2)
  }

  const flagValue = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    if (i === -1) return undefined
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      console.error(`${flag} requires an argument\n\n${USAGE}`)
      process.exit(2)
    }
    return value
  }

  const provider = flagValue('--provider') ?? null
  if (provider !== null && !(provider in PROVIDERS)) {
    console.error(`Unknown provider: ${provider} (expected aws, azure, or gcp)\n\n${USAGE}`)
    process.exit(2)
  }

  return {
    ci: argv.includes('--ci'),
    outDir: flagValue('--out') ?? 'preflight-report',
    provider: provider as ProviderId | null,
  }
}

const EXTERNAL_FLOCI = Boolean(process.env.PREFLIGHT_EXTERNAL_FLOCI)
const NO_OPEN = Boolean(process.env.PREFLIGHT_NO_OPEN)
const options = parseCliOptions(process.argv.slice(2))

/** Gets the provider's Floci emulator ready and returns a teardown function for exit. */
async function ensureFloci(provider: (typeof PROVIDERS)[ProviderId]): Promise<() => Promise<void>> {
  if (EXTERNAL_FLOCI) {
    const healthUrl = process.env.PREFLIGHT_FLOCI_HEALTH_URL ?? provider.defaultHealthUrl
    console.log(`Waiting for Floci at ${healthUrl}...`)
    await waitForFlociReady(healthUrl)
    return async () => {} // Compose (or whatever started it) owns Floci's lifecycle, not us.
  }

  if (!(await checkFlociInstalled())) {
    throw new Error('floci is not installed. Install it from https://floci.io, then try again.')
  }

  console.log(`Starting Floci (${provider.id})...`)
  const weStartedFloci = await startFloci(provider)
  if (!weStartedFloci) console.log('Floci was already running, leaving it up on exit.')

  return async () => {
    if (!weStartedFloci) return
    console.log('Stopping Floci...')
    await stopFloci(provider).catch(() => {})
  }
}

/** Builds the environment terraform runs with, guaranteeing it can only ever talk to the
 * emulator: real cloud credentials are scrubbed, and for AWS (where the endpoint override
 * travels via AWS_ENDPOINT_URL rather than the Terraform config) the endpoint must be set. */
function emulatorOnlyEnv(base: NodeJS.ProcessEnv, providerId: ProviderId): NodeJS.ProcessEnv {
  if (providerId === 'aws' && !base.AWS_ENDPOINT_URL) {
    throw new Error(
      'AWS_ENDPOINT_URL is not set, so terraform would talk to real AWS. ' +
        'Point it at the Floci emulator (e.g. http://localhost:4566).',
    )
  }
  return scrubCloudCredentials(base)
}

async function main() {
  const cwd = process.cwd()

  const providerId = options.provider ?? (await detectProvider(cwd))
  if (!providerId) {
    throw new Error(
      `Could not detect a cloud provider from the Terraform config in ${cwd}. ` +
        'Pass --provider aws|azure|gcp.',
    )
  }
  const provider = PROVIDERS[providerId]

  const teardownFloci = await ensureFloci(provider)

  let torndown = false
  const teardown = async () => {
    if (torndown) return
    torndown = true
    await teardownFloci()
  }

  try {
    const baseEnv =
      EXTERNAL_FLOCI || !provider.useFlociEnv
        ? { ...process.env }
        : { ...process.env, ...(await getFlociEnv(provider)) }
    const env = emulatorOnlyEnv(baseEnv, providerId)

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
