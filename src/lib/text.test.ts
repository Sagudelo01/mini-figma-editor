import { describe, expect, it } from 'vitest'
import { measureTextBox, textPatchWithBox } from './text'
import type { TextShape } from '../types'

const sample: TextShape = {
  id: 't',
  kind: 'text',
  x: 0,
  y: 0,
  width: 100,
  height: 40,
  rotation: 0,
  fill: '#000',
  text: 'Hello',
  fontSize: 32,
  bold: false,
}

describe('measureTextBox', () => {
  it('returns a positive box and scales height with font size', () => {
    const small = measureTextBox('Hi', 10, false)
    const large = measureTextBox('Hi', 40, false)
    expect(small.width).toBeGreaterThan(0)
    expect(large.height).toBeGreaterThan(small.height)
  })
})

describe('textPatchWithBox', () => {
  it('merges the change and recomputes the box', () => {
    const patch = textPatchWithBox(sample, { text: 'Hello world' })
    expect(patch.text).toBe('Hello world')
    expect(patch.width).toBeGreaterThan(0)
    expect(patch.height).toBeGreaterThan(0)
  })
})
