import { describe, expect, it } from 'vitest'
import { computeResize, computeRotation, normalizeDegrees } from './transform'
import { MIN_SIZE } from '../constants'

describe('normalizeDegrees', () => {
  it('wraps into the [0, 360) range', () => {
    expect(normalizeDegrees(-90)).toBe(270)
    expect(normalizeDegrees(450)).toBe(90)
    expect(normalizeDegrees(0)).toBe(0)
  })
})

describe('computeRotation', () => {
  const center = { x: 0, y: 0 }

  it('is zero when the pointer is directly above the center', () => {
    expect(computeRotation(center, { x: 0, y: -10 })).toBeCloseTo(0)
  })

  it('is 90 when the pointer is to the right', () => {
    expect(computeRotation(center, { x: 10, y: 0 })).toBeCloseTo(90)
  })

  it('snaps to the nearest increment', () => {
    expect(computeRotation(center, { x: 10, y: 1 }, 15)).toBe(90)
  })
})

describe('computeResize', () => {
  it('keeps the fixed corner pinned when unrotated', () => {
    const box = computeResize(0, { x: 0, y: 0 }, { x: 120, y: 80 })
    expect(box).toEqual({ x: 0, y: 0, width: 120, height: 80 })
  })

  it('enforces a minimum size', () => {
    const box = computeResize(0, { x: 0, y: 0 }, { x: 4, y: 4 })
    expect(box.width).toBe(MIN_SIZE)
    expect(box.height).toBe(MIN_SIZE)
  })

  it('resizes along the shape own axes when rotated', () => {
    const box = computeResize(90, { x: 0, y: 0 }, { x: -80, y: 100 })
    expect(box.width).toBeCloseTo(100)
    expect(box.height).toBeCloseTo(80)
    expect(box.x).toBeCloseTo(-90)
    expect(box.y).toBeCloseTo(10)
  })
})
