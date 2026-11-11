import { useEditorStore } from '../store/useEditorStore'
import { exportToPng } from '../lib/exportPng'
import { IconCircle, IconExport, IconRectangle, IconRedo, IconText, IconUndo } from './icons'

export function Toolbar(): React.JSX.Element {
  const addRectangle = useEditorStore((state) => state.addRectangle)
  const addCircle = useEditorStore((state) => state.addCircle)
  const addText = useEditorStore((state) => state.addText)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const shapes = useEditorStore((state) => state.shapes)
  const background = useEditorStore((state) => state.background)

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor actions">
      <div className="toolbar-group">
        <button
          className="tool-btn"
          onClick={addRectangle}
          aria-label="Rectangle"
          data-tooltip="Rectangle"
        >
          <IconRectangle />
        </button>
        <button className="tool-btn" onClick={addCircle} aria-label="Circle" data-tooltip="Circle">
          <IconCircle />
        </button>
        <button className="tool-btn" onClick={addText} aria-label="Text" data-tooltip="Text">
          <IconText />
        </button>
      </div>

      <span className="toolbar-divider" aria-hidden="true" />

      <div className="toolbar-group">
        <button
          className="tool-btn"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          data-tooltip="Undo · Ctrl+Z"
        >
          <IconUndo />
        </button>
        <button
          className="tool-btn"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          data-tooltip="Redo · Ctrl+Shift+Z"
        >
          <IconRedo />
        </button>
      </div>

      <span className="toolbar-divider" aria-hidden="true" />

      <button
        className="tool-btn"
        onClick={() => exportToPng(shapes, background)}
        disabled={shapes.length === 0}
        aria-label="Export PNG"
        data-tooltip="Export PNG"
      >
        <IconExport />
      </button>
    </div>
  )
}
