import type { Shape } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants'
import { drawScene } from './render'

// Render at 2x so exported images stay crisp on high-density displays.
const EXPORT_SCALE = 2

export function exportToPng(shapes: readonly Shape[], filename = 'mini-figma.png'): void {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH * EXPORT_SCALE
  canvas.height = CANVAS_HEIGHT * EXPORT_SCALE
  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawScene(ctx, shapes)

  canvas.toBlob((blob) => {
    if (blob === null) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
