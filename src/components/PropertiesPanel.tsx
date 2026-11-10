import { useEditorStore } from '../store/useEditorStore'
import type { ShapePatch } from '../store/useEditorStore'
import type { Shape } from '../types'
import { MIN_SIZE } from '../constants'

interface NumberFieldProps {
  label: string
  value: number
  min?: number
  onCommit: (value: number) => void
}

function NumberField({ label, value, min, onCommit }: NumberFieldProps): React.JSX.Element {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onCommit(next)
        }}
      />
    </label>
  )
}

function ShapeProperties({ shape }: { shape: Shape }): React.JSX.Element {
  const updateShape = useEditorStore((state) => state.updateShape)
  const deleteShape = useEditorStore((state) => state.deleteShape)

  const patch = (change: ShapePatch): void => updateShape(shape.id, change)

  return (
    <div className="properties">
      <div className="properties-kind">{shape.kind}</div>

      <div className="field-grid">
        <NumberField label="X" value={shape.x} onCommit={(x) => patch({ x })} />
        <NumberField label="Y" value={shape.y} onCommit={(y) => patch({ y })} />
        <NumberField
          label="W"
          value={shape.width}
          min={MIN_SIZE}
          onCommit={(width) => patch({ width: Math.max(MIN_SIZE, width) })}
        />
        <NumberField
          label="H"
          value={shape.height}
          min={MIN_SIZE}
          onCommit={(height) => patch({ height: Math.max(MIN_SIZE, height) })}
        />
        <NumberField
          label="Rotation"
          value={shape.rotation}
          onCommit={(rotation) => patch({ rotation })}
        />
      </div>

      <label className="field field-color">
        <span className="field-label">Color</span>
        <span className="color-control">
          <input
            type="color"
            value={shape.fill}
            onChange={(event) => patch({ fill: event.target.value })}
          />
          <span className="color-value">{shape.fill}</span>
        </span>
      </label>

      <button type="button" className="delete-button" onClick={() => deleteShape(shape.id)}>
        Delete
      </button>
    </div>
  )
}

export function PropertiesPanel(): React.JSX.Element {
  const selected = useEditorStore((state) =>
    state.shapes.find((shape) => shape.id === state.selectedId),
  )

  return (
    <aside className="panel" aria-label="Properties">
      {selected === undefined ? (
        <p className="panel-empty">Select a shape to edit its properties.</p>
      ) : (
        <ShapeProperties shape={selected} />
      )}
    </aside>
  )
}
