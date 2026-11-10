import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { Shape } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH, HANDLE_SIZE, SELECTION_COLOR } from '../constants'
import { findTopmostShapeAt, getCenter, type Point } from '../lib/geometry'

/** Applies the shape's rotation around its center, runs `draw`, then restores. */
function withRotation(ctx: CanvasRenderingContext2D, shape: Shape, draw: () => void): void {
  const center = getCenter(shape)
  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate((shape.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)
  draw()
  ctx.restore()
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
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

function drawSelection(ctx: CanvasRenderingContext2D, shape: Shape): void {
  withRotation(ctx, shape, () => {
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = 1.5
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)

    const corners: Point[] = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ]
    ctx.fillStyle = '#ffffff'
    for (const corner of corners) {
      const half = HANDLE_SIZE / 2
      ctx.fillRect(corner.x - half, corner.y - half, HANDLE_SIZE, HANDLE_SIZE)
      ctx.strokeRect(corner.x - half, corner.y - half, HANDLE_SIZE, HANDLE_SIZE)
    }
  })
}

export function Canvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapes = useEditorStore((state) => state.shapes)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectShape = useEditorStore((state) => state.selectShape)

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

    const selected = shapes.find((shape) => shape.id === selectedId)
    if (selected !== undefined) {
      drawSelection(ctx, selected)
    }
  }, [shapes, selectedId])

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>): void {
    const point = getCanvasPoint(event)
    const hit = findTopmostShapeAt(shapes, point)
    selectShape(hit?.id ?? null)
  }

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onPointerDown={handlePointerDown}
    />
  )
}
