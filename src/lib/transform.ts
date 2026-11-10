import { MIN_SIZE } from '../constants'
import { rotateVector, type Point } from './geometry'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Clamps a signed length so its magnitude is at least MIN_SIZE, keeping sign. */
function clampSigned(value: number): number {
  const sign = value < 0 ? -1 : 1
  return Math.abs(value) < MIN_SIZE ? MIN_SIZE * sign : value
}

/**
 * Resizes a rotated shape by dragging one corner while the opposite corner
 * (`fixedWorld`) stays pinned in world space.
 *
 * Works in the shape's local (unrotated) frame: the pointer offset from the
 * fixed corner is rotated back by -rotation to get axis-aligned width/height,
 * and the new center is the midpoint between the fixed and dragged corners.
 */
export function computeResize(rotationDeg: number, fixedWorld: Point, pointer: Point): Box {
  const angle = (rotationDeg * Math.PI) / 180
  const worldDelta: Point = { x: pointer.x - fixedWorld.x, y: pointer.y - fixedWorld.y }
  const localDelta = rotateVector(worldDelta, -angle)

  const lx = clampSigned(localDelta.x)
  const ly = clampSigned(localDelta.y)
  const width = Math.abs(lx)
  const height = Math.abs(ly)

  const halfWorld = rotateVector({ x: lx / 2, y: ly / 2 }, angle)
  const centerX = fixedWorld.x + halfWorld.x
  const centerY = fixedWorld.y + halfWorld.y

  return { x: centerX - width / 2, y: centerY - height / 2, width, height }
}

/** Normalizes an angle in degrees to the [0, 360) range. */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/**
 * Rotation (degrees) so the shape's top edge points toward `pointer` from
 * `center`. Optionally snaps to the nearest `snapDeg` increment.
 */
export function computeRotation(center: Point, pointer: Point, snapDeg?: number): number {
  const phi = Math.atan2(pointer.y - center.y, pointer.x - center.x)
  let deg = (phi * 180) / Math.PI + 90
  if (snapDeg !== undefined && snapDeg > 0) {
    deg = Math.round(deg / snapDeg) * snapDeg
  }
  return normalizeDegrees(deg)
}
