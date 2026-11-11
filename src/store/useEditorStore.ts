import { create } from 'zustand'
import type { BaseShape, CircleShape, RectangleShape, Shape, TextShape } from '../types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FILL,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from '../constants'

export type ShapePatch = Partial<
  Pick<BaseShape, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'fill'>
>

interface Snapshot {
  shapes: Shape[]
  background: string
}

interface EditorState {
  shapes: Shape[]
  selectedId: string | null
  background: string
  past: Snapshot[]
  future: Snapshot[]
  // Revision bumped on every mutation; beginChange compares it to the revision
  // of the last snapshot so a no-op (e.g. focusing a field) adds no history.
  rev: number
  snapshotRev: number
  addRectangle: () => void
  addCircle: () => void
  addText: () => void
  duplicateShape: (id: string) => void
  selectShape: (id: string | null) => void
  beginChange: () => void
  updateShape: (id: string, patch: ShapePatch) => void
  setBackground: (color: string) => void
  deleteShape: (id: string) => void
  undo: () => void
  redo: () => void

  // View state (zoom/pan). Kept out of history so undo/redo never move the view.
  zoom: number
  pan: { x: number; y: number }
  viewport: { w: number; h: number }
  viewReady: boolean
  setViewport: (w: number, h: number) => void
  setPan: (pan: { x: number; y: number }) => void
  zoomAt: (factor: number, screenX: number, screenY: number) => void
  zoomInAtCenter: () => void
  zoomOutAtCenter: () => void
  resetView: () => void
}

function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
}

function centerPan(w: number, h: number, zoom: number): { x: number; y: number } {
  return { x: (w - CANVAS_WIDTH * zoom) / 2, y: (h - CANVAS_HEIGHT * zoom) / 2 }
}

// Staircase successive shapes so they don't spawn exactly on top of each other.
let spawnIndex = 0

function spawnPosition(width: number, height: number): { x: number; y: number } {
  const step = 24
  const offset = (spawnIndex % 6) * step
  spawnIndex += 1
  return {
    x: Math.round((CANVAS_WIDTH - width) / 2 + offset - step * 2.5),
    y: Math.round((CANVAS_HEIGHT - height) / 2 + offset - step * 2.5),
  }
}

function createId(): string {
  return crypto.randomUUID()
}

function clone(shapes: readonly Shape[]): Shape[] {
  return shapes.map((shape) => ({ ...shape }))
}

const initialShapes: Shape[] = [
  {
    id: 'rect-1',
    kind: 'rectangle',
    x: 180,
    y: 140,
    width: 240,
    height: 160,
    rotation: 0,
    fill: DEFAULT_FILL,
  },
]

export const useEditorStore = create<EditorState>()((set, get) => {
  function mutate(partial: Partial<EditorState>): void {
    set((state) => ({ ...partial, rev: state.rev + 1 }))
  }

  function addShape(shape: Shape): void {
    get().beginChange()
    mutate({ shapes: [...get().shapes, shape], selectedId: shape.id })
  }

  return {
    shapes: initialShapes,
    selectedId: null,
    background: '#ffffff',
    past: [],
    future: [],
    rev: 0,
    snapshotRev: -1,

    addRectangle: () => {
      const width = 160
      const height = 120
      const { x, y } = spawnPosition(width, height)
      addShape({
        id: createId(),
        kind: 'rectangle',
        x,
        y,
        width,
        height,
        rotation: 0,
        fill: DEFAULT_FILL,
      } satisfies RectangleShape)
    },

    addCircle: () => {
      const size = 140
      const { x, y } = spawnPosition(size, size)
      addShape({
        id: createId(),
        kind: 'circle',
        x,
        y,
        width: size,
        height: size,
        rotation: 0,
        fill: '#059669',
      } satisfies CircleShape)
    },

    addText: () => {
      const fontSize = 32
      const width = 160
      const height = Math.round(fontSize * 1.2)
      const { x, y } = spawnPosition(width, height)
      addShape({
        id: createId(),
        kind: 'text',
        x,
        y,
        width,
        height,
        rotation: 0,
        fill: '#111827',
        text: 'Text',
        fontSize,
      } satisfies TextShape)
    },

    duplicateShape: (id) => {
      const original = get().shapes.find((shape) => shape.id === id)
      if (original === undefined) return
      const copy: Shape = { ...original, id: createId(), x: original.x + 16, y: original.y + 16 }
      get().beginChange()
      mutate({ shapes: [...get().shapes, copy], selectedId: copy.id })
    },

    selectShape: (id) => set({ selectedId: id }),

    beginChange: () => {
      const { rev, snapshotRev, past, shapes, background } = get()
      if (rev === snapshotRev) return
      set({ past: [...past, { shapes: clone(shapes), background }], future: [], snapshotRev: rev })
    },

    updateShape: (id, patch) =>
      mutate({
        shapes: get().shapes.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
      }),

    setBackground: (color) => mutate({ background: color }),

    deleteShape: (id) => {
      get().beginChange()
      const { shapes, selectedId } = get()
      mutate({
        shapes: shapes.filter((shape) => shape.id !== id),
        selectedId: selectedId === id ? null : selectedId,
      })
    },

    undo: () =>
      set((state) => {
        const prev = state.past.at(-1)
        if (prev === undefined) return state
        const rev = state.rev + 1
        return {
          shapes: prev.shapes,
          background: prev.background,
          past: state.past.slice(0, -1),
          future: [...state.future, { shapes: clone(state.shapes), background: state.background }],
          selectedId: prev.shapes.some((s) => s.id === state.selectedId) ? state.selectedId : null,
          rev,
          snapshotRev: rev,
        }
      }),

    redo: () =>
      set((state) => {
        const next = state.future.at(-1)
        if (next === undefined) return state
        const rev = state.rev + 1
        return {
          shapes: next.shapes,
          background: next.background,
          past: [...state.past, { shapes: clone(state.shapes), background: state.background }],
          future: state.future.slice(0, -1),
          selectedId: next.shapes.some((s) => s.id === state.selectedId) ? state.selectedId : null,
          rev,
          snapshotRev: rev,
        }
      }),

    zoom: 1,
    pan: { x: 0, y: 0 },
    viewport: { w: CANVAS_WIDTH, h: CANVAS_HEIGHT },
    viewReady: false,

    setViewport: (w, h) =>
      set((state) =>
        state.viewReady
          ? { viewport: { w, h } }
          : { viewport: { w, h }, viewReady: true, pan: centerPan(w, h, state.zoom) },
      ),

    setPan: (pan) => set({ pan }),

    zoomAt: (factor, screenX, screenY) =>
      set((state) => {
        const zoom = clampZoom(state.zoom * factor)
        const lx = (screenX - state.pan.x) / state.zoom
        const ly = (screenY - state.pan.y) / state.zoom
        return { zoom, pan: { x: screenX - lx * zoom, y: screenY - ly * zoom } }
      }),

    zoomInAtCenter: () => {
      const { viewport, zoomAt } = get()
      zoomAt(ZOOM_STEP, viewport.w / 2, viewport.h / 2)
    },

    zoomOutAtCenter: () => {
      const { viewport, zoomAt } = get()
      zoomAt(1 / ZOOM_STEP, viewport.w / 2, viewport.h / 2)
    },

    resetView: () =>
      set((state) => ({ zoom: 1, pan: centerPan(state.viewport.w, state.viewport.h, 1) })),
  }
})
