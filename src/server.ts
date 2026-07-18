import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { PlanResult } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface RunningServer {
  url: string
  close: () => Promise<void>
}

export function startServer(plan: PlanResult, port = 4700): Promise<RunningServer> {
  const app = express()
  const webDist = join(__dirname, '..', 'web', 'dist')

  app.use(express.static(webDist))
  app.get('/api/plan', (_req, res) => res.json(plan))

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      resolve({
        url: `http://localhost:${port}`,
        close: () => new Promise((res) => server.close(() => res())),
      })
    })
  })
}
