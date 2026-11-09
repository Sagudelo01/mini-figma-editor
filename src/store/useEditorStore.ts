import { create } from 'zustand'
import type { Shape } from '../types'

interface EditorState {
  shapes: Shape[]
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
    fill: '#4f46e5',
  },
]

export const useEditorStore = create<EditorState>()(() => ({
  shapes: initialShapes,
}))
