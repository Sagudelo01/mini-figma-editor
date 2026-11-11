import { describe, expect, it } from 'vitest'
import type { RectangleShape, CircleShape } from '../types'
import {
  distanceSquared,
  findTopmostShapeAt,
  getCenter,
  getCorners,
  getRotateHandle,
  hitTest,
  oppositeCorner,
  rotateVector,
} from './geometry'
import { ROTATE_HANDLE_OFFSET } from '../constants'

function rect(overrides: Partial<RectangleShape> = {}): RectangleShape {
  return {
    id: 'r',
    kind: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    fill: '#000',
    ...overrides,
  }
}

function circle(overrides: Partial<CircleShape> = {}): CircleShape {
  return { ...rect(), kind: 'circle', ...overrides }
}

describe('getCenter', () => {
  it('returns the bounding box center', () => {
    expect(getCenter(rect({ x: 180, y: 140, width: 240, height: 160 }))).toEqual({ x: 300, y: 220 })
  })
})

describe('rotateVector', () => {
  it('rotates 90 degrees clockwise in a y-down space', () => {
    const r = rotateVector({ x: 1, y: 0 }, Math.PI / 2)
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(1)
  })
})

describe('hitTest', () => {
  it('detects points inside and outside an axis-aligned rectangle', () => {
    const r = rect()
    expect(hitTest(r, { x: 50, y: 50 })).toBe(true)
    expect(hitTest(r, { x: 150, y: 50 })).toBe(false)
  })

  it('uses the ellipse equation for circles', () => {
    const c = circle()
    expect(hitTest(c, { x: 50, y: 50 })).toBe(true)
    expect(hitTest(c, { x: 95, y: 50 })).toBe(true)
    expect(hitTest(c, { x: 99, y: 99 })).toBe(false)
  })

  it('accounts for rotation', () => {
    // A tall-but-thin rectangle rotated 90deg becomes wide; a point off to the
    // side is only inside once rotation is honored.
    const r = rect({ width: 40, height: 200, rotation: 90 })
    expect(hitTest(r, { x: 90, y: 100 })).toBe(true)
    expect(hitTest(r, { x: 20, y: 20 })).toBe(false)
  })
})

describe('findTopmostShapeAt', () => {
  it('returns the last (topmost) overlapping shape', () => {
    const bottom = rect({ id: 'bottom' })
    const top = rect({ id: 'top' })
    expect(findTopmostShapeAt([bottom, top], { x: 50, y: 50 })?.id).toBe('top')
  })

  it('returns undefined when nothing is hit', () => {
    expect(findTopmostShapeAt([rect()], { x: 500, y: 500 })).toBeUndefined()
  })
})

describe('getCorners', () => {
  it('returns axis-aligned corners when unrotated', () => {
    const corners = getCorners(rect())
    expect(corners.tl).toEqual({ x: 0, y: 0 })
    expect(corners.br).toEqual({ x: 100, y: 100 })
  })
})

describe('getRotateHandle', () => {
  it('floats above the top edge when unrotated', () => {
    const handle = getRotateHandle(rect())
    expect(handle.x).toBeCloseTo(50)
    expect(handle.y).toBeCloseTo(-ROTATE_HANDLE_OFFSET)
  })
})

describe('oppositeCorner', () => {
  it('maps each corner to its diagonal', () => {
    expect(oppositeCorner('tl')).toBe('br')
    expect(oppositeCorner('tr')).toBe('bl')
    expect(oppositeCorner('br')).toBe('tl')
    expect(oppositeCorner('bl')).toBe('tr')
  })
})

describe('distanceSquared', () => {
  it('computes squared distance', () => {
    expect(distanceSquared({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25)
  })
})
