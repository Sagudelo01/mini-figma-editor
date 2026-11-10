import { create } from 'zustand'
import type { BaseShape, CircleShape, RectangleShape, Shape, TextShape } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_FILL } from '../constants'

export type ShapePatch = Partial<
  Pick<BaseShape, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'fill'>
>

interface EditorState {
  shapes: Shape[]
  selectedId: string | null
  addRectangle: () => void
  addCircle: () => void
  addText: () => void
  selectShape: (id: string | null) => void
  updateShape: (id: string, patch: ShapePatch) => void
  deleteShape: (id: string) => void
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

export const useEditorStore = create<EditorState>()((set) => ({
  shapes: initialShapes,
  selectedId: null,

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
    set((state) => ({ shapes: [...state.shapes, shape], selectedId: shape.id }))
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
    set((state) => ({ shapes: [...state.shapes, shape], selectedId: shape.id }))
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
    set((state) => ({ shapes: [...state.shapes, shape], selectedId: shape.id }))
  },

  selectShape: (id) => set({ selectedId: id }),

  updateShape: (id, patch) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
}))
