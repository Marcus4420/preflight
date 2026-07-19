import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { PlanResult } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** `</script>` inside the bundle would terminate the inline script tag early; escape it the
 * way bundler inliners do (valid inside JS strings and regexes alike). */
function escapeInlineScript(js: string): string {
  return js.replaceAll('</script>', '<\\/script>')
}

/** Writes a single self-contained index.html into outDir - the web UI with its JS, CSS, and
 * the plan data all inlined - plus a machine-readable plan.json. Inlining everything (rather
 * than copying the assets directory) matters because browsers block module scripts loaded
 * from file:// URLs, and a downloaded CI artifact is opened exactly that way. */
export async function exportStaticSite(plan: PlanResult, outDir: string): Promise<void> {
  const webDist = join(__dirname, '..', 'web', 'dist')
  let html = await readFile(join(webDist, 'index.html'), 'utf8')

  const scriptTag = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)
  const styleTag = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
  if (!scriptTag || !styleTag) {
    throw new Error('web/dist/index.html does not look like a Vite build (script/style tags not found)')
  }

  const js = await readFile(join(webDist, scriptTag[1]), 'utf8')
  const css = await readFile(join(webDist, styleTag[1]), 'utf8')

  // Function replacements so `$&` and friends inside the bundle aren't treated as
  // replacement patterns.
  html = html
    .replace(styleTag[0], () => `<style>\n${css}\n</style>`)
    .replace(
      scriptTag[0],
      () =>
        `<script>window.__PREFLIGHT_PLAN__ = ${JSON.stringify(plan)};</script>\n` +
        `<script type="module">\n${escapeInlineScript(js)}\n</script>`,
    )

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'index.html'), html)
  await writeFile(join(outDir, 'plan.json'), JSON.stringify(plan, null, 2))
}
