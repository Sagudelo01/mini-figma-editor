import { useEffect } from 'react'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { ZoomControls } from './components/ZoomControls'
import { ThemeToggle } from './components/ThemeToggle'
import { TextEditor } from './components/TextEditor'
import { useEditorStore } from './store/useEditorStore'
import './App.css'

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)
}

function App(): React.JSX.Element {
  const isEmpty = useEditorStore((state) => state.shapes.length === 0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isTextEntry(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      const store = useEditorStore.getState()

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">Mini Figma</div>
        <Toolbar />
        <div className="app-header-end">
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
