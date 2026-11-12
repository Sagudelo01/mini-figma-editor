import type { Point } from './geometry'
import type { CanvasSize } from '../store/useEditorStore'

// Keep at least this much of the artboard on screen so it can't be lost.
export const PAN_MARGIN = 120

export function clampPan(
  pan: Point,
  zoom: number,
  viewport: { w: number; h: number },
  canvas: CanvasSize,
): Point {
  const w = canvas.width * zoom
  const h = canvas.height * zoom
  const clamp = (value: number, min: number, max: number): number =>
    min > max ? value : Math.min(max, Math.max(min, value))
  return {
    x: clamp(pan.x, PAN_MARGIN - w, viewport.w - PAN_MARGIN),
    y: clamp(pan.y, PAN_MARGIN - h, viewport.h - PAN_MARGIN),
  }
}
