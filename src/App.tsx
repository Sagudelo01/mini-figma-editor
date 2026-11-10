import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import './App.css'

function App(): React.JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Figma</h1>
        <Toolbar />
      </header>
      <main className="app-main">
        <Canvas />
      </main>
    </div>
  )
}

export default App
