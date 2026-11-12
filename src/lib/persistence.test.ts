import { afterEach, describe, expect, it } from 'vitest'
import { loadDocument, saveDocument, type PersistedDocument } from './persistence'

const doc: PersistedDocument = {
  shapes: [
    {
      id: 'r',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      fill: '#000',
    },
  ],
  canvas: { width: 1080, height: 1080 },
  background: '#ffffff',
}

afterEach(() => localStorage.clear())

describe('persistence', () => {
  it('round-trips a saved document', () => {
    saveDocument(doc)
    expect(loadDocument()).toEqual(doc)
  })

  it('returns null when nothing is stored', () => {
    expect(loadDocument()).toBeNull()
  })

  it('returns null for malformed data', () => {
    localStorage.setItem('mini-figma-document', '{ not json')
    expect(loadDocument()).toBeNull()
    localStorage.setItem('mini-figma-document', JSON.stringify({ shapes: 'nope' }))
    expect(loadDocument()).toBeNull()
  })
})
