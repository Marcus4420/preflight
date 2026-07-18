import { BaseEdge, type EdgeProps, type Edge } from '@xyflow/react'
import type { GraphEdgeData } from './buildGraph'

type PlanEdgeType = Edge<GraphEdgeData>

const CORNER_RADIUS = 12

function roundedPath(points: { x: number; y: number }[], radius: number): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y} `

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const inLen = Math.hypot(curr.x - prev.x, curr.y - prev.y)
    const outLen = Math.hypot(next.x - curr.x, next.y - curr.y)
    const r = Math.min(radius, inLen / 2, outLen / 2)

    const inRatio = (inLen - r) / inLen
    const before = {
      x: prev.x + (curr.x - prev.x) * inRatio,
      y: prev.y + (curr.y - prev.y) * inRatio,
    }
    const outRatio = r / outLen
    const after = {
      x: curr.x + (next.x - curr.x) * outRatio,
      y: curr.y + (next.y - curr.y) * outRatio,
    }

    d += `L ${before.x} ${before.y} Q ${curr.x} ${curr.y} ${after.x} ${after.y} `
  }

  const last = points[points.length - 1]
  d += `L ${last.x} ${last.y}`
  return d
}

export default function PlanEdge({ data, markerEnd, style }: EdgeProps<PlanEdgeType>) {
  const points = data?.points ?? []
  if (points.length < 2) return null

  const path = roundedPath(points, CORNER_RADIUS)

  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />
}
