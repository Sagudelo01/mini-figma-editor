import { describe, expect, it } from 'vitest'
import { clampPan, PAN_MARGIN } from './view'

const viewport = { w: 1000, h: 800 }
const canvas = { width: 800, height: 600 }

describe('clampPan', () => {
  it('leaves an in-bounds pan unchanged', () => {
    expect(clampPan({ x: 100, y: 50 }, 1, viewport, canvas)).toEqual({ x: 100, y: 50 })
  })

  it('stops the artboard from leaving past the right/bottom edge', () => {
    const clamped = clampPan({ x: 5000, y: 5000 }, 1, viewport, canvas)
    expect(clamped.x).toBe(viewport.w - PAN_MARGIN)
    expect(clamped.y).toBe(viewport.h - PAN_MARGIN)
  })

  it('stops the artboard from leaving past the left/top edge', () => {
    const clamped = clampPan({ x: -5000, y: -5000 }, 1, viewport, canvas)
    expect(clamped.x).toBe(PAN_MARGIN - canvas.width)
    expect(clamped.y).toBe(PAN_MARGIN - canvas.height)
  })

  it('accounts for zoom', () => {
    const clamped = clampPan({ x: -5000, y: 0 }, 2, viewport, canvas)
    expect(clamped.x).toBe(PAN_MARGIN - canvas.width * 2)
  })
})
