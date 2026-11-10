import { useEditorStore } from '../store/useEditorStore'

export function Toolbar(): React.JSX.Element {
  const addRectangle = useEditorStore((state) => state.addRectangle)
  const addCircle = useEditorStore((state) => state.addCircle)
  const addText = useEditorStore((state) => state.addText)

  return (
    <div className="toolbar" role="toolbar" aria-label="Create shapes">
      <button type="button" onClick={addRectangle}>
        Rectangle
      </button>
      <button type="button" onClick={addCircle}>
        Circle
      </button>
      <button type="button" onClick={addText}>
        Text
      </button>
    </div>
  )
}
