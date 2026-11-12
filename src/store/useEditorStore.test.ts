import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './useEditorStore'

function reset(): void {
  useEditorStore.setState({
    shapes: [],
    selectedId: null,
    editingId: null,
    editingIsNew: false,
    background: '#ffffff',
    canvas: { width: 800, height: 600 },
    past: [],
    future: [],
    rev: 0,
    snapshotRev: -1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    viewport: { w: 1000, h: 600 },
    viewReady: true,
  })
}

beforeEach(reset)

describe('creating shapes', () => {
  it('adds a shape and selects it', () => {
    useEditorStore.getState().addRectangle()
    const { shapes, selectedId } = useEditorStore.getState()
    expect(shapes).toHaveLength(1)
    expect(shapes[0]?.kind).toBe('rectangle')
    expect(selectedId).toBe(shapes[0]?.id)
  })

  it('records history so the add can be undone', () => {
    useEditorStore.getState().addCircle()
    expect(useEditorStore.getState().past).toHaveLength(1)
  })
})

describe('updateShape', () => {
  it('patches only the targeted shape', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    const id = useEditorStore.getState().shapes[0]!.id
    store.updateShape(id, { x: 42, fill: '#ff0000' })
    const shape = useEditorStore.getState().shapes[0]!
    expect(shape.x).toBe(42)
    expect(shape.fill).toBe('#ff0000')
  })
})

describe('duplicateShape', () => {
  it('creates an offset copy with a new id and selects it', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    const original = useEditorStore.getState().shapes[0]!
    store.duplicateShape(original.id)
    const { shapes, selectedId } = useEditorStore.getState()
    expect(shapes).toHaveLength(2)
    const copy = shapes[1]!
    expect(copy.id).not.toBe(original.id)
    expect(copy.x).toBe(original.x + 16)
    expect(selectedId).toBe(copy.id)
  })
})

describe('deleteShape', () => {
  it('removes the shape and clears the selection', () => {
    const store = useEditorStore.getState()
    store.addText()
    const id = useEditorStore.getState().shapes[0]!.id
    store.deleteShape(id)
    const state = useEditorStore.getState()
    expect(state.shapes).toHaveLength(0)
    expect(state.selectedId).toBeNull()
  })
})

describe('background', () => {
  it('updates the canvas background and can be undone', () => {
    const store = useEditorStore.getState()
    store.beginChange()
    store.setBackground('#101010')
    expect(useEditorStore.getState().background).toBe('#101010')

    store.undo()
    expect(useEditorStore.getState().background).toBe('#ffffff')
  })
})

describe('canvas size', () => {
  it('resizes the artboard without touching shapes, and can be undone', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    const shapeBefore = { ...useEditorStore.getState().shapes[0]! }

    store.beginChange()
    store.setCanvasSize(1080, 1080)
    const state = useEditorStore.getState()
    expect(state.canvas).toEqual({ width: 1080, height: 1080 })
    // Shapes keep their geometry; the artboard is not a transform.
    expect(state.shapes[0]).toEqual(shapeBefore)

    store.undo()
    expect(useEditorStore.getState().canvas).toEqual({ width: 800, height: 600 })
  })

  it('clamps the size to the minimum', () => {
    useEditorStore.getState().setCanvasSize(5, 5)
    expect(useEditorStore.getState().canvas).toEqual({ width: 50, height: 50 })
  })
})

describe('text editing', () => {
  it('addText creates a text shape and starts editing it', () => {
    const id = useEditorStore.getState().addText()
    const state = useEditorStore.getState()
    expect(state.editingId).toBe(id)
    expect(state.editingIsNew).toBe(true)
    expect(state.shapes[0]?.kind).toBe('text')
  })

  it('finishTextEdit removes a text left empty', () => {
    const id = useEditorStore.getState().addText()
    useEditorStore.getState().updateShape(id, { text: '' })
    useEditorStore.getState().finishTextEdit()
    const state = useEditorStore.getState()
    expect(state.editingId).toBeNull()
    expect(state.shapes).toHaveLength(0)
  })

  it('cancelTextEdit discards a freshly created text', () => {
    useEditorStore.getState().addText()
    useEditorStore.getState().cancelTextEdit('Text')
    expect(useEditorStore.getState().shapes).toHaveLength(0)
  })

  it('cancelTextEdit restores the original text of an existing shape', () => {
    const id = useEditorStore.getState().addText()
    useEditorStore.getState().finishTextEdit()
    useEditorStore.getState().startTextEdit(id, false)
    useEditorStore.getState().updateShape(id, { text: 'changed' })
    useEditorStore.getState().cancelTextEdit('Text')
    const shape = useEditorStore.getState().shapes[0]
    expect(shape?.kind === 'text' && shape.text).toBe('Text')
  })
})

describe('layer order', () => {
  it('brings a shape to the front and sends it to the back', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    store.addCircle()
    const [first, second] = useEditorStore.getState().shapes.map((s) => s.id)

    store.sendToBack(second!)
    expect(useEditorStore.getState().shapes.map((s) => s.id)).toEqual([second, first])

    store.bringToFront(second!)
    expect(useEditorStore.getState().shapes.map((s) => s.id)).toEqual([first, second])
  })

  it('toggles locked and hidden flags', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    const id = useEditorStore.getState().shapes[0]!.id
    store.toggleLocked(id)
    expect(useEditorStore.getState().shapes[0]?.locked).toBe(true)
    store.toggleHidden(id)
    expect(useEditorStore.getState().shapes[0]?.hidden).toBe(true)
    store.toggleLocked(id)
    expect(useEditorStore.getState().shapes[0]?.locked).toBe(false)
  })
})

describe('undo / redo', () => {
  it('undo reverts the last change and redo reapplies it', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    expect(useEditorStore.getState().shapes).toHaveLength(1)

    store.undo()
    expect(useEditorStore.getState().shapes).toHaveLength(0)

    store.redo()
    expect(useEditorStore.getState().shapes).toHaveLength(1)
  })

  it('does nothing when there is no history', () => {
    const store = useEditorStore.getState()
    store.undo()
    store.redo()
    expect(useEditorStore.getState().shapes).toHaveLength(0)
  })
})

describe('beginChange', () => {
  it('does not stack entries when nothing changed in between', () => {
    const store = useEditorStore.getState()
    store.beginChange()
    store.beginChange()
    expect(useEditorStore.getState().past).toHaveLength(1)
  })
})

describe('view / zoom', () => {
  const logicalUnder = (sx: number): number => {
    const { pan, zoom } = useEditorStore.getState()
    return (sx - pan.x) / zoom
  }

  it('keeps the point under the cursor fixed while zooming', () => {
    const before = logicalUnder(100)
    useEditorStore.getState().zoomAt(2, 100, 100)
    expect(useEditorStore.getState().zoom).toBe(2)
    expect(logicalUnder(100)).toBeCloseTo(before)
  })

  it('clamps zoom to the maximum', () => {
    useEditorStore.getState().zoomAt(1000, 0, 0)
    expect(useEditorStore.getState().zoom).toBe(5)
  })

  it('resetView centers the artboard at 100%', () => {
    useEditorStore.getState().zoomAt(3, 10, 10)
    useEditorStore.getState().resetView()
    const { zoom, pan } = useEditorStore.getState()
    expect(zoom).toBe(1)
    expect(pan).toEqual({ x: 100, y: 0 })
  })

  it('is not affected by undo/redo', () => {
    const store = useEditorStore.getState()
    store.addRectangle()
    store.zoomAt(2, 0, 0)
    store.undo()
    expect(useEditorStore.getState().zoom).toBe(2)
    store.redo()
    expect(useEditorStore.getState().zoom).toBe(2)
  })
})
