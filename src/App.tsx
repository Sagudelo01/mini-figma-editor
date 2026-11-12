import { useEffect, useRef } from 'react'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { ZoomControls } from './components/ZoomControls'
import { ThemeToggle } from './components/ThemeToggle'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { TextEditor } from './components/TextEditor'
import { useEditorStore } from './store/useEditorStore'
import { saveDocument } from './lib/persistence'
import './App.css'

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)
}

const ARROW_DELTAS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

function App(): React.JSX.Element {
  const isEmpty = useEditorStore((state) => state.shapes.length === 0)
  const nudgeAt = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isTextEntry(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      const store = useEditorStore.getState()

      const delta = ARROW_DELTAS[event.key]
      if (delta !== undefined && store.selectedId !== null && !mod) {
        const shape = store.shapes.find((s) => s.id === store.selectedId)
        if (shape !== undefined) {
          event.preventDefault()
          const now = Date.now()
          // Group a burst of nudges into a single undo step.
          if (now - nudgeAt.current > 600) store.beginChange()
          nudgeAt.current = now
          const step = event.shiftKey ? 10 : 1
          store.updateShape(shape.id, { x: shape.x + delta.x * step, y: shape.y + delta.y * step })
        }
        return
      }

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.redo()
        else store.undo()
        return
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        store.redo()
        return
      }
      if (mod && event.key.toLowerCase() === 'd') {
        if (store.selectedId !== null) {
          event.preventDefault()
          store.duplicateShape(store.selectedId)
        }
        return
      }
      if (mod && event.key === '0') {
        event.preventDefault()
        store.resetView()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (store.selectedId !== null) {
          event.preventDefault()
          store.deleteShape(store.selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (
        state.shapes === prev.shapes &&
        state.canvas === prev.canvas &&
        state.background === prev.background
      ) {
        return
      }
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        saveDocument({ shapes: state.shapes, canvas: state.canvas, background: state.background })
      }, 300)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">Mini Figma</div>
        <Toolbar />
        <div className="app-header-end">
          <ShortcutsHelp />
          <ThemeToggle />
        </div>
      </header>
      <div className="app-body">
        <main className="app-main">
          <Canvas />
          <TextEditor />
          {isEmpty && (
            <div className="canvas-hint" aria-hidden="true">
              Add a shape from the toolbar to get started
            </div>
          )}
          <ZoomControls />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default App
