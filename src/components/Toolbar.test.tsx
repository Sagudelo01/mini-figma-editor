import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Toolbar } from './Toolbar'
import { useEditorStore } from '../store/useEditorStore'

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

describe('Toolbar', () => {
  it('creates a shape when a shape button is clicked', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Circle' }))
    const { shapes } = useEditorStore.getState()
    expect(shapes).toHaveLength(1)
    expect(shapes[0]?.kind).toBe('circle')
  })

  it('disables undo, redo and export until there is something to act on', () => {
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: /Undo/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Redo/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Export PNG/ })).toBeDisabled()
  })

  it('enables undo and export after a shape is added', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(screen.getByRole('button', { name: /Undo/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Export PNG/ })).toBeEnabled()
  })
})
