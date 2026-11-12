import { useEditorStore } from '../store/useEditorStore'
import type { ShapePatch } from '../store/useEditorStore'
import type { Shape, TextShape } from '../types'
import { CANVAS_PRESETS, MIN_CANVAS_SIZE, MIN_FONT_SIZE, MIN_SIZE } from '../constants'
import { textPatchWithBox } from '../lib/text'
import {
  IconBack,
  IconDuplicate,
  IconEye,
  IconEyeOff,
  IconFront,
  IconLock,
  IconTrash,
  IconUnlock,
} from './icons'

interface NumberFieldProps {
  label: string
  value: number
  min?: number
  onBeginChange: () => void
  onCommit: (value: number) => void
}

function NumberField({
  label,
  value,
  min,
  onBeginChange,
  onCommit,
}: NumberFieldProps): React.JSX.Element {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        onFocus={onBeginChange}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onCommit(next)
        }}
      />
    </label>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onBeginChange: () => void
  onCommit: (value: string) => void
}

function ColorField({ label, value, onBeginChange, onCommit }: ColorFieldProps): React.JSX.Element {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="color-control">
        <input
          type="color"
          aria-label={label}
          value={value}
          onFocus={onBeginChange}
          onChange={(event) => onCommit(event.target.value)}
        />
        <span className="color-value">{value}</span>
      </div>
    </div>
  )
}

function TextFields({ shape }: { shape: TextShape }): React.JSX.Element {
  const updateShape = useEditorStore((state) => state.updateShape)
  const beginChange = useEditorStore((state) => state.beginChange)

  const apply = (change: Partial<Pick<TextShape, 'text' | 'fontSize' | 'bold'>>): void =>
    updateShape(shape.id, textPatchWithBox(shape, change))

  return (
    <>
      <label className="field">
        <span className="field-label">Content</span>
        <input
          type="text"
          value={shape.text}
          onFocus={beginChange}
          onChange={(event) => apply({ text: event.target.value })}
        />
      </label>

      <div className="field-grid">
        <NumberField
          label="Font size"
          value={shape.fontSize}
          min={MIN_FONT_SIZE}
          onBeginChange={beginChange}
          onCommit={(fontSize) => apply({ fontSize: Math.max(MIN_FONT_SIZE, fontSize) })}
        />
        <div className="field">
          <span className="field-label">Weight</span>
          <button
            type="button"
            className="toggle-button"
            aria-pressed={shape.bold}
            onClick={() => {
              beginChange()
              apply({ bold: !shape.bold })
            }}
          >
            Bold
          </button>
        </div>
      </div>
    </>
  )
}

function ShapeProperties({ shape }: { shape: Shape }): React.JSX.Element {
  const updateShape = useEditorStore((state) => state.updateShape)
  const deleteShape = useEditorStore((state) => state.deleteShape)
  const duplicateShape = useEditorStore((state) => state.duplicateShape)
  const bringToFront = useEditorStore((state) => state.bringToFront)
  const sendToBack = useEditorStore((state) => state.sendToBack)
  const beginChange = useEditorStore((state) => state.beginChange)

  const patch = (change: ShapePatch): void => updateShape(shape.id, change)

  return (
    <div className="properties">
      <div className="panel-section-title">{shape.kind}</div>

      <div className="field-grid">
        <NumberField
          label="X"
          value={shape.x}
          onBeginChange={beginChange}
          onCommit={(x) => patch({ x })}
        />
        <NumberField
          label="Y"
          value={shape.y}
          onBeginChange={beginChange}
          onCommit={(y) => patch({ y })}
        />
        <NumberField
          label="W"
          value={shape.width}
          min={MIN_SIZE}
          onBeginChange={beginChange}
          onCommit={(width) => patch({ width: Math.max(MIN_SIZE, width) })}
        />
        <NumberField
          label="H"
          value={shape.height}
          min={MIN_SIZE}
          onBeginChange={beginChange}
          onCommit={(height) => patch({ height: Math.max(MIN_SIZE, height) })}
        />
        <NumberField
          label="Rotation"
          value={shape.rotation}
          onBeginChange={beginChange}
          onCommit={(rotation) => patch({ rotation })}
        />
      </div>

      {shape.kind === 'text' && <TextFields shape={shape} />}

      <ColorField
        label="Fill"
        value={shape.fill}
        onBeginChange={beginChange}
        onCommit={(fill) => patch({ fill })}
      />

      <div className="icon-row">
        <button
          type="button"
          className="icon-action"
          onClick={() => bringToFront(shape.id)}
          aria-label="Bring to front"
          title="Bring to front"
        >
          <IconFront />
        </button>
        <button
          type="button"
          className="icon-action"
          onClick={() => sendToBack(shape.id)}
          aria-label="Send to back"
          title="Send to back"
        >
          <IconBack />
        </button>
      </div>

      <div className="panel-actions">
        <button type="button" className="ghost-button" onClick={() => duplicateShape(shape.id)}>
          <IconDuplicate />
          Duplicate
        </button>
        <button type="button" className="danger-button" onClick={() => deleteShape(shape.id)}>
          <IconTrash />
          Delete
        </button>
      </div>
    </div>
  )
}

function layerLabel(shape: Shape): string {
  if (shape.kind === 'text') return shape.text.trim() === '' ? 'Text' : shape.text
  return shape.kind.charAt(0).toUpperCase() + shape.kind.slice(1)
}

function LayersPanel(): React.JSX.Element | null {
  const shapes = useEditorStore((state) => state.shapes)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectShape = useEditorStore((state) => state.selectShape)
  const toggleLocked = useEditorStore((state) => state.toggleLocked)
  const toggleHidden = useEditorStore((state) => state.toggleHidden)

  if (shapes.length === 0) return null

  return (
    <div className="layers">
      <div className="panel-section-title">Layers</div>
      <ul className="layer-list">
        {[...shapes].reverse().map((shape) => (
          <li key={shape.id} className={`layer-row${shape.id === selectedId ? ' selected' : ''}`}>
            <button
              type="button"
              className="layer-name"
              onClick={() => selectShape(shape.id)}
              title={layerLabel(shape)}
            >
              {layerLabel(shape)}
            </button>
            <button
              type="button"
              className="layer-icon"
              aria-label={shape.hidden === true ? 'Show layer' : 'Hide layer'}
              aria-pressed={shape.hidden === true}
              onClick={() => toggleHidden(shape.id)}
            >
              {shape.hidden === true ? <IconEyeOff /> : <IconEye />}
            </button>
            <button
              type="button"
              className="layer-icon"
              aria-label={shape.locked === true ? 'Unlock layer' : 'Lock layer'}
              aria-pressed={shape.locked === true}
              onClick={() => toggleLocked(shape.id)}
            >
              {shape.locked === true ? <IconLock /> : <IconUnlock />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CanvasProperties(): React.JSX.Element {
  const background = useEditorStore((state) => state.background)
  const canvas = useEditorStore((state) => state.canvas)
  const setBackground = useEditorStore((state) => state.setBackground)
  const setCanvasSize = useEditorStore((state) => state.setCanvasSize)
  const resetView = useEditorStore((state) => state.resetView)
  const beginChange = useEditorStore((state) => state.beginChange)

  const applyPreset = (width: number, height: number): void => {
    beginChange()
    setCanvasSize(width, height)
    resetView()
  }

  return (
    <div className="properties">
      <div className="panel-section-title">Canvas</div>

      <div className="field-grid">
        <NumberField
          label="W"
          value={canvas.width}
          min={MIN_CANVAS_SIZE}
          onBeginChange={beginChange}
          onCommit={(width) => setCanvasSize(width, canvas.height)}
        />
        <NumberField
          label="H"
          value={canvas.height}
          min={MIN_CANVAS_SIZE}
          onBeginChange={beginChange}
          onCommit={(height) => setCanvasSize(canvas.width, height)}
        />
      </div>

      <div className="field">
        <span className="field-label">Presets</span>
        <div className="preset-list">
          {CANVAS_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-button"
              aria-pressed={canvas.width === preset.width && canvas.height === preset.height}
              onClick={() => applyPreset(preset.width, preset.height)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <ColorField
        label="Background"
        value={background}
        onBeginChange={beginChange}
        onCommit={setBackground}
      />

      <p className="panel-hint">Select a shape to edit it.</p>
    </div>
  )
}

export function PropertiesPanel(): React.JSX.Element {
  const selected = useEditorStore((state) =>
    state.shapes.find((shape) => shape.id === state.selectedId),
  )

  return (
    <aside className="panel" aria-label="Properties">
      {selected === undefined ? <CanvasProperties /> : <ShapeProperties shape={selected} />}
      <LayersPanel />
    </aside>
  )
}
