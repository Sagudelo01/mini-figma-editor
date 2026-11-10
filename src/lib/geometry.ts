import type { Shape } from '../types'
import { ROTATE_HANDLE_OFFSET } from '../constants'

export interface Point {
  x: number
  y: number
}

export type CornerId = 'tl' | 'tr' | 'br' | 'bl'

export function getCenter(shape: Shape): Point {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }
}

// Clockwise rotation in a y-down space (the canvas convention).
export function rotateVector(v: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos }
}

export function rotatePoint(point: Point, center: Point, angleRad: number): Point {
  const d = rotateVector({ x: point.x - center.x, y: point.y - center.y }, angleRad)
  return { x: center.x + d.x, y: center.y + d.y }
}

// Undo the shape's rotation so callers can test against its axis-aligned box.
export function toLocalPoint(shape: Shape, point: Point): Point {
  const center = getCenter(shape)
  return rotatePoint(point, center, (-shape.rotation * Math.PI) / 180)
}

export function hitTest(shape: Shape, point: Point): boolean {
  const local = toLocalPoint(shape, point)

  if (shape.kind === 'circle') {
    const rx = shape.width / 2
    const ry = shape.height / 2
    if (rx === 0 || ry === 0) return false
    const nx = (local.x - (shape.x + rx)) / rx
    const ny = (local.y - (shape.y + ry)) / ry
    return nx * nx + ny * ny <= 1
  }

  return (
    local.x >= shape.x &&
    local.x <= shape.x + shape.width &&
    local.y >= shape.y &&
    local.y <= shape.y + shape.height
  )
}

// Topmost shape is the one drawn last, so search back to front.
export function findTopmostShapeAt(shapes: readonly Shape[], point: Point): Shape | undefined {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    if (shape !== undefined && hitTest(shape, point)) return shape
  }
  return undefined
}

export function getCorners(shape: Shape): Record<CornerId, Point> {
  const center = getCenter(shape)
  const hw = shape.width / 2
  const hh = shape.height / 2
  const angle = (shape.rotation * Math.PI) / 180
  const offset = (dx: number, dy: number): Point => {
    const v = rotateVector({ x: dx, y: dy }, angle)
    return { x: center.x + v.x, y: center.y + v.y }
  }
  return {
    tl: offset(-hw, -hh),
    tr: offset(hw, -hh),
    br: offset(hw, hh),
    bl: offset(-hw, hh),
  }
}

export function getRotateHandle(shape: Shape): Point {
  const center = getCenter(shape)
  const angle = (shape.rotation * Math.PI) / 180
  const v = rotateVector({ x: 0, y: -(shape.height / 2) - ROTATE_HANDLE_OFFSET }, angle)
  return { x: center.x + v.x, y: center.y + v.y }
}

export function oppositeCorner(corner: CornerId): CornerId {
  const map: Record<CornerId, CornerId> = { tl: 'br', tr: 'bl', br: 'tl', bl: 'tr' }
  return map[corner]
}

export function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}
