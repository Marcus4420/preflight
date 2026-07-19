import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { PlanResult } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Writes a self-contained copy of the web UI into outDir, with the plan data inlined so it
 * renders the same interactive graph without needing a running server — for CI artifacts and
 * PR links, where nothing will be listening on localhost. */
export async function exportStaticSite(plan: PlanResult, outDir: string): Promise<void> {
  const webDist = join(__dirname, '..', 'web', 'dist')

  await mkdir(outDir, { recursive: true })
  await cp(webDist, outDir, { recursive: true })

  const indexPath = join(outDir, 'index.html')
  const html = await readFile(indexPath, 'utf8')
  const inlined = html.replace(
    '<script type="module"',
    `<script>window.__PREFLIGHT_PLAN__ = ${JSON.stringify(plan)};</script>\n    <script type="module"`,
  )
  await writeFile(indexPath, inlined)

  await writeFile(join(outDir, 'plan.json'), JSON.stringify(plan, null, 2))
}
