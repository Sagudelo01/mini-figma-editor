import type { Shape } from '../types'
import type { CanvasSize } from '../store/useEditorStore'

const KEY = 'mini-figma-document'

export interface PersistedDocument {
  shapes: Shape[]
  canvas: CanvasSize
  background: string
}

function isCanvasSize(value: unknown): value is CanvasSize {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CanvasSize).width === 'number' &&
    typeof (value as CanvasSize).height === 'number'
  )
}

export function loadDocument(): PersistedDocument | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const doc = data as Record<string, unknown>
    if (
      !Array.isArray(doc.shapes) ||
      typeof doc.background !== 'string' ||
      !isCanvasSize(doc.canvas)
    ) {
      return null
    }
    return { shapes: doc.shapes as Shape[], canvas: doc.canvas, background: doc.background }
  } catch {
    return null
  }
}

export function saveDocument(doc: PersistedDocument): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc))
  } catch {
    // Storage may be full or unavailable; losing the autosave is acceptable.
  }
}
