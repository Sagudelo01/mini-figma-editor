import { useEditorStore } from '../store/useEditorStore'
import { exportToPng } from '../lib/exportPng'

export function Toolbar(): React.JSX.Element {
  const addRectangle = useEditorStore((state) => state.addRectangle)
  const addCircle = useEditorStore((state) => state.addCircle)
  const addText = useEditorStore((state) => state.addText)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const shapes = useEditorStore((state) => state.shapes)

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor actions">
      <button type="button" onClick={addRectangle}>
        Rectangle
      </button>
      <button type="button" onClick={addCircle}>
        Circle
      </button>
      <button type="button" onClick={addText}>
        Text
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      <button
        type="button"
        onClick={() => exportToPng(shapes)}
        disabled={shapes.length === 0}
        title="Export the canvas as a PNG"
      >
        Export PNG
      </button>
    </div>
  )
}
