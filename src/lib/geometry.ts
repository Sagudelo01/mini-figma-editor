import type { Shape } from '../types'

export interface Point {
  x: number
  y: number
}

/** Center of a shape's bounding box, in canvas coordinates. */
export function getCenter(shape: Shape): Point {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }
}

/** Rotates `point` around `center` by `angleRad` radians (clockwise, y-down). */
export function rotatePoint(point: Point, center: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

/**
 * Maps a canvas-space point into the shape's local (unrotated) space, so that
 * axis-aligned tests can be used regardless of the shape's rotation.
 */
export function toLocalPoint(shape: Shape, point: Point): Point {
  const center = getCenter(shape)
  return rotatePoint(point, center, (-shape.rotation * Math.PI) / 180)
}

/** Whether `point` (canvas space) lies inside the shape, honoring rotation. */
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

  // Rectangles and text use their axis-aligned bounding box.
  return (
    local.x >= shape.x &&
    local.x <= shape.x + shape.width &&
    local.y >= shape.y &&
    local.y <= shape.y + shape.height
  )
}

/** Returns the topmost shape (last drawn) under `point`, or undefined. */
export function findTopmostShapeAt(shapes: readonly Shape[], point: Point): Shape | undefined {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    if (shape !== undefined && hitTest(shape, point)) return shape
  }
  return undefined
}
