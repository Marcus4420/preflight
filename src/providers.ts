import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type ProviderId = 'aws' | 'azure' | 'gcp'

export interface ProviderConfig {
  id: ProviderId
  /** Subcommand prefix for the floci CLI: `floci <prefix...> start|stop|status|env`. */
  flociSubcommand: string[]
  defaultHealthUrl: string
  /** Terraform provider names (in `provider "..."` blocks) that map to this emulator. */
  terraformProviders: string[]
  /** Whether `floci env` output should be merged into terraform's environment. AWS needs
   * AWS_ENDPOINT_URL from it; the Azure/GCP examples wire endpoints via terraform variables. */
  useFlociEnv: boolean
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  aws: {
    id: 'aws',
    flociSubcommand: [],
    defaultHealthUrl: 'http://localhost:4566/_floci/health',
    terraformProviders: ['aws'],
    useFlociEnv: true,
  },
  azure: {
    id: 'azure',
    flociSubcommand: ['az'],
    defaultHealthUrl: 'http://localhost:4577/_floci/health',
    terraformProviders: ['azurerm', 'azuread', 'azapi'],
    useFlociEnv: false,
  },
  gcp: {
    id: 'gcp',
    flociSubcommand: ['gcp'],
    defaultHealthUrl: 'http://localhost:4588/_floci/health',
    terraformProviders: ['google', 'google-beta'],
    useFlociEnv: false,
  },
}

/** Detects which cloud provider a Terraform directory targets by scanning its .tf files for
 * `provider "..."` blocks. Returns null when nothing recognizable is found; throws when the
 * config mixes providers that need different emulators (pass --provider to disambiguate). */
export async function detectProvider(cwd: string): Promise<ProviderId | null> {
  const files = (await readdir(cwd)).filter((f) => f.endsWith('.tf'))
  const found = new Set<ProviderId>()

  for (const file of files) {
    const source = await readFile(join(cwd, file), 'utf8')
    for (const match of source.matchAll(/^\s*provider\s+"([\w-]+)"/gm)) {
      for (const provider of Object.values(PROVIDERS)) {
        if (provider.terraformProviders.includes(match[1])) found.add(provider.id)
      }
    }
  }

  if (found.size > 1) {
    throw new Error(
      `Terraform config in ${cwd} uses multiple cloud providers (${[...found].join(', ')}). ` +
        'Run preflight with --provider to pick which emulator to use.',
    )
  }

  return found.size === 1 ? [...found][0] : null
}

/** Strips real cloud credentials from the environment terraform runs with, so a preflight
 * run can never authenticate against a real cloud even on a machine or CI runner that holds
 * deploy secrets. Dummy AWS values are set because the AWS provider requires some value. */
export function scrubCloudCredentials(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env = { ...base }

  // AWS
  delete env.AWS_PROFILE
  delete env.AWS_SESSION_TOKEN
  env.AWS_ACCESS_KEY_ID = 'test'
  env.AWS_SECRET_ACCESS_KEY = 'test'

  // Azure (azurerm reads ARM_*; service principals and CLI/managed identity paths)
  for (const key of Object.keys(env)) {
    if (key.startsWith('ARM_')) delete env[key]
  }
  delete env.AZURE_CLIENT_ID
  delete env.AZURE_CLIENT_SECRET
  delete env.AZURE_TENANT_ID
  delete env.AZURE_FEDERATED_TOKEN_FILE

  // GCP
  delete env.GOOGLE_APPLICATION_CREDENTIALS
  delete env.GOOGLE_CREDENTIALS
  delete env.GOOGLE_OAUTH_ACCESS_TOKEN
  delete env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT

  return env
}
