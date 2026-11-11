import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PropertiesPanel } from './PropertiesPanel'
import { useEditorStore } from '../store/useEditorStore'
import type { RectangleShape } from '../types'

const sampleRect: RectangleShape = {
  id: 'rect',
  kind: 'rectangle',
  x: 180,
  y: 140,
  width: 240,
  height: 160,
  rotation: 0,
  fill: '#4f46e5',
}

function selectSample(): void {
  useEditorStore.setState({
    shapes: [{ ...sampleRect }],
    selectedId: sampleRect.id,
    background: '#ffffff',
    past: [],
    future: [],
    rev: 0,
    snapshotRev: -1,
  })
}

beforeEach(() => {
  useEditorStore.setState({
    shapes: [],
    selectedId: null,
    background: '#ffffff',
    past: [],
    future: [],
    rev: 0,
    snapshotRev: -1,
  })
})

describe('PropertiesPanel', () => {
  it('shows an empty message when nothing is selected', () => {
    render(<PropertiesPanel />)
    expect(screen.getByText(/select a shape/i)).toBeInTheDocument()
  })

  it('renders the selected shape values', () => {
    selectSample()
    render(<PropertiesPanel />)
    expect(screen.getByRole('spinbutton', { name: 'X' })).toHaveValue(180)
    expect(screen.getByRole('spinbutton', { name: 'W' })).toHaveValue(240)
  })

  it('writes field edits back to the store', () => {
    selectSample()
    render(<PropertiesPanel />)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'X' }), { target: { value: '300' } })
    expect(useEditorStore.getState().shapes[0]?.x).toBe(300)
  })

  it('deletes the shape via the delete button', () => {
    selectSample()
    render(<PropertiesPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(useEditorStore.getState().shapes).toHaveLength(0)
    expect(useEditorStore.getState().selectedId).toBeNull()
  })
})
