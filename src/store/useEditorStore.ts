import { create } from 'zustand'
import type { BaseShape, CircleShape, RectangleShape, Shape, TextShape } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_FILL } from '../constants'

export type ShapePatch = Partial<
  Pick<BaseShape, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'fill'>
>

interface EditorState {
  shapes: Shape[]
  selectedId: string | null
  past: Shape[][]
  future: Shape[][]
  // The shapes array reference already captured in `past`, so a no-op
  // beginChange (e.g. focusing a field without editing) doesn't stack entries.
  snapshotRef: Shape[] | null
  addRectangle: () => void
  addCircle: () => void
  addText: () => void
  selectShape: (id: string | null) => void
  beginChange: () => void
  updateShape: (id: string, patch: ShapePatch) => void
  deleteShape: (id: string) => void
  undo: () => void
  redo: () => void
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
  function addShape(shape: Shape): void {
    get().beginChange()
    set((state) => ({ shapes: [...state.shapes, shape], selectedId: shape.id }))
  }

  return {
    shapes: initialShapes,
    selectedId: null,
    past: [],
    future: [],
    snapshotRef: null,

    addRectangle: () => {
      const width = 160
      const height = 120
      const { x, y } = spawnPosition(width, height)
      const shape: RectangleShape = {
        id: createId(),
        kind: 'rectangle',
        x,
        y,
        width,
        height,
        rotation: 0,
        fill: DEFAULT_FILL,
      }
      addShape(shape)
    },

    addCircle: () => {
      const size = 140
      const { x, y } = spawnPosition(size, size)
      const shape: CircleShape = {
        id: createId(),
        kind: 'circle',
        x,
        y,
        width: size,
        height: size,
        rotation: 0,
        fill: '#059669',
      }
      addShape(shape)
    },

    addText: () => {
      const fontSize = 32
      const width = 160
      const height = Math.round(fontSize * 1.2)
      const { x, y } = spawnPosition(width, height)
      const shape: TextShape = {
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
      }
      addShape(shape)
    },

    selectShape: (id) => set({ selectedId: id }),

    beginChange: () => {
      const { shapes, snapshotRef, past } = get()
      if (shapes === snapshotRef) return
      set({ past: [...past, clone(shapes)], future: [], snapshotRef: shapes })
    },

    updateShape: (id, patch) =>
      set((state) => ({
        shapes: state.shapes.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
      })),

    deleteShape: (id) => {
      get().beginChange()
      set((state) => ({
        shapes: state.shapes.filter((shape) => shape.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      }))
    },

    undo: () =>
      set((state) => {
        const prev = state.past.at(-1)
        if (prev === undefined) return state
        return {
          shapes: prev,
          snapshotRef: prev,
          past: state.past.slice(0, -1),
          future: [...state.future, clone(state.shapes)],
          selectedId: prev.some((s) => s.id === state.selectedId) ? state.selectedId : null,
        }
      }),

    redo: () =>
      set((state) => {
        const next = state.future.at(-1)
        if (next === undefined) return state
        return {
          shapes: next,
          snapshotRef: next,
          past: [...state.past, clone(state.shapes)],
          future: state.future.slice(0, -1),
          selectedId: next.some((s) => s.id === state.selectedId) ? state.selectedId : null,
        }
      }),
  }
})
