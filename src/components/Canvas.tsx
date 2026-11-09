import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { Shape } from '../types'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

/** Draws a single shape onto the 2D context, honoring its rotation. */
function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((shape.rotation * Math.PI) / 180)
  ctx.translate(-centerX, -centerY)

  ctx.fillStyle = shape.fill

  switch (shape.kind) {
    case 'rectangle':
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
      break
    case 'circle':
    case 'text':
      // Rendered in later phases.
      break
  }

  ctx.restore()
}

export function Canvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapes = useEditorStore((state) => state.shapes)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    for (const shape of shapes) {
      drawShape(ctx, shape)
    }
  }, [shapes])

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    />
  )
}
