import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './useEditorStore'

function reset(): void {
  useEditorStore.setState({
    shapes: [],
    selectedId: null,
    past: [],
    future: [],
    snapshotRef: null,
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
