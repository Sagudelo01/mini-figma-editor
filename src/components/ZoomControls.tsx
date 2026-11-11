import { useEditorStore } from '../store/useEditorStore'
import { IconZoomIn, IconZoomOut } from './icons'

export function ZoomControls(): React.JSX.Element {
  const zoom = useEditorStore((state) => state.zoom)
  const zoomIn = useEditorStore((state) => state.zoomInAtCenter)
  const zoomOut = useEditorStore((state) => state.zoomOutAtCenter)
  const reset = useEditorStore((state) => state.resetView)

  return (
    <div className="zoom-controls">
      <button className="zoom-btn" onClick={zoomOut} aria-label="Zoom out">
        <IconZoomOut />
      </button>
      <button
        className="zoom-pct"
        onClick={reset}
        aria-label="Reset zoom to 100%"
        title="Reset to 100% (Ctrl+0)"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button className="zoom-btn" onClick={zoomIn} aria-label="Zoom in">
        <IconZoomIn />
      </button>
    </div>
  )
}
