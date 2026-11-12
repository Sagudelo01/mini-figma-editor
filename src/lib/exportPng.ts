import type { Shape } from '../types'
import type { CanvasSize } from '../store/useEditorStore'
import { drawScene } from './render'

// Render at 2x so exported images stay crisp on high-density displays.
const EXPORT_SCALE = 2

export function exportToPng(
  shapes: readonly Shape[],
  background: string,
  canvas: CanvasSize,
  filename = 'mini-figma.png',
): void {
  const el = document.createElement('canvas')
  el.width = canvas.width * EXPORT_SCALE
  el.height = canvas.height * EXPORT_SCALE
  const ctx = el.getContext('2d')
  if (ctx === null) return

  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawScene(ctx, shapes)

  el.toBlob((blob) => {
    if (blob === null) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
