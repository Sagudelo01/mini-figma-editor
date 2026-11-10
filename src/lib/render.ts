import type { Shape } from '../types'
import { getCenter } from './geometry'

export function withRotation(ctx: CanvasRenderingContext2D, shape: Shape, draw: () => void): void {
  const center = getCenter(shape)
  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate((shape.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)
  draw()
  ctx.restore()
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  withRotation(ctx, shape, () => {
    ctx.fillStyle = shape.fill
    switch (shape.kind) {
      case 'rectangle':
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
        break
      case 'circle': {
        const rx = shape.width / 2
        const ry = shape.height / 2
        ctx.beginPath()
        ctx.ellipse(shape.x + rx, shape.y + ry, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'text':
        ctx.textBaseline = 'top'
        ctx.font = `${shape.fontSize}px system-ui, sans-serif`
        ctx.fillText(shape.text, shape.x, shape.y)
        break
    }
  })
}

export function drawScene(ctx: CanvasRenderingContext2D, shapes: readonly Shape[]): void {
  for (const shape of shapes) {
    drawShape(ctx, shape)
  }
}
