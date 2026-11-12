import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { TextShape } from '../types'
import { textPatchWithBox } from '../lib/text'

export function TextEditor(): React.JSX.Element | null {
  const inputRef = useRef<HTMLInputElement>(null)
  const originalRef = useRef('')
  const startedRef = useRef(false)

  const editingId = useEditorStore((state) => state.editingId)
  const editingIsNew = useEditorStore((state) => state.editingIsNew)
  const zoom = useEditorStore((state) => state.zoom)
  const pan = useEditorStore((state) => state.pan)
  const shape = useEditorStore((state) =>
    state.shapes.find((s): s is TextShape => s.id === state.editingId && s.kind === 'text'),
  )

  useEffect(() => {
    if (editingId === null) return
    const current = useEditorStore.getState().shapes.find((s) => s.id === editingId)
    originalRef.current = current?.kind === 'text' ? current.text : ''
    startedRef.current = false
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editingId])

  if (editingId === null || shape === undefined) return null

  const store = useEditorStore.getState()

  const handleChange = (value: string): void => {
    if (!editingIsNew && !startedRef.current) {
      store.beginChange()
      startedRef.current = true
    }
    store.updateShape(shape.id, textPatchWithBox(shape, { text: value }))
  }

  return (
    <input
      ref={inputRef}
      className="text-editor"
      value={shape.text}
      spellCheck={false}
      style={{
        left: pan.x + shape.x * zoom,
        top: pan.y + shape.y * zoom,
        width: Math.max(shape.width, 12) * zoom,
        height: shape.height * zoom,
        fontSize: shape.fontSize * zoom,
        fontWeight: shape.bold ? 600 : 400,
        color: shape.fill,
        transform: `rotate(${shape.rotation}deg)`,
        transformOrigin: 'center',
      }}
      onChange={(event) => handleChange(event.target.value)}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') {
          event.preventDefault()
          store.finishTextEdit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          store.cancelTextEdit(originalRef.current)
        }
      }}
      onBlur={() => store.finishTextEdit()}
    />
  )
}
