import { useEffect } from 'react'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { useEditorStore } from './store/useEditorStore'
import './App.css'

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)
}

function App(): React.JSX.Element {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (isTextEntry(event.target)) return
      const { selectedId, deleteShape } = useEditorStore.getState()
      if (selectedId !== null) {
        event.preventDefault()
        deleteShape(selectedId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Figma</h1>
        <Toolbar />
      </header>
      <div className="app-body">
        <main className="app-main">
          <Canvas />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default App
