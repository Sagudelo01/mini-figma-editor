import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { Shape } from '../types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HANDLE_HIT_RADIUS,
  HANDLE_SIZE,
  ROTATE_HANDLE_OFFSET,
  ROTATE_HANDLE_RADIUS,
  SELECTION_COLOR,
} from '../constants'
import {
  distanceSquared,
  findTopmostShapeAt,
  getCenter,
  getCorners,
  getRotateHandle,
  oppositeCorner,
  type CornerId,
  type Point,
} from '../lib/geometry'
import { computeResize, computeRotation } from '../lib/transform'

type Interaction =
  | { kind: 'move'; id: string; startPointer: Point; startX: number; startY: number }
  | { kind: 'resize'; id: string; rotation: number; fixedWorld: Point }
  | { kind: 'rotate'; id: string; center: Point }

const CORNER_CURSORS: Record<CornerId, string> = {
  tl: 'nwse-resize',
  br: 'nwse-resize',
  tr: 'nesw-resize',
  bl: 'nesw-resize',
}

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

    // Rotation handle: a stem above the top edge with a grab circle on top.
    const topCenterX = shape.x + shape.width / 2
    ctx.beginPath()
    ctx.moveTo(topCenterX, shape.y)
    ctx.lineTo(topCenterX, shape.y - ROTATE_HANDLE_OFFSET)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(topCenterX, shape.y - ROTATE_HANDLE_OFFSET, ROTATE_HANDLE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.stroke()

    const corners: Point[] = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ]
    const half = HANDLE_SIZE / 2
    for (const corner of corners) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(corner.x - half, corner.y - half, HANDLE_SIZE, HANDLE_SIZE)
      ctx.strokeRect(corner.x - half, corner.y - half, HANDLE_SIZE, HANDLE_SIZE)
    }
  })
}

export function Canvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const interactionRef = useRef<Interaction | null>(null)

  const shapes = useEditorStore((state) => state.shapes)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectShape = useEditorStore((state) => state.selectShape)
  const updateShape = useEditorStore((state) => state.updateShape)

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

  function hitHandle(shape: Shape, point: Point): 'rotate' | CornerId | null {
    const radiusSq = HANDLE_HIT_RADIUS * HANDLE_HIT_RADIUS
    if (distanceSquared(point, getRotateHandle(shape)) <= radiusSq) return 'rotate'
    const corners = getCorners(shape)
    for (const id of Object.keys(corners) as CornerId[]) {
      if (distanceSquared(point, corners[id]) <= radiusSq) return id
    }
    return null
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>): void {
    const point = getCanvasPoint(event)
    const selected = shapes.find((shape) => shape.id === selectedId)

    if (selected !== undefined) {
      const handle = hitHandle(selected, point)
      if (handle === 'rotate') {
        interactionRef.current = { kind: 'rotate', id: selected.id, center: getCenter(selected) }
        event.currentTarget.setPointerCapture(event.pointerId)
        return
      }
      if (handle !== null) {
        const corners = getCorners(selected)
        interactionRef.current = {
          kind: 'resize',
          id: selected.id,
          rotation: selected.rotation,
          fixedWorld: corners[oppositeCorner(handle)],
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        return
      }
    }

    const hit = findTopmostShapeAt(shapes, point)
    if (hit !== undefined) {
      selectShape(hit.id)
      interactionRef.current = {
        kind: 'move',
        id: hit.id,
        startPointer: point,
        startX: hit.x,
        startY: hit.y,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    } else {
      selectShape(null)
    }
  }

  function updateCursor(canvas: HTMLCanvasElement, point: Point): void {
    const selected = shapes.find((shape) => shape.id === selectedId)
    if (selected !== undefined) {
      const handle = hitHandle(selected, point)
      if (handle === 'rotate') {
        canvas.style.cursor = 'grab'
        return
      }
      if (handle !== null) {
        canvas.style.cursor = CORNER_CURSORS[handle]
        return
      }
    }
    canvas.style.cursor = findTopmostShapeAt(shapes, point) !== undefined ? 'move' : 'default'
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>): void {
    const point = getCanvasPoint(event)
    const interaction = interactionRef.current

    if (interaction === null) {
      updateCursor(event.currentTarget, point)
      return
    }

    switch (interaction.kind) {
      case 'move':
        updateShape(interaction.id, {
          x: interaction.startX + (point.x - interaction.startPointer.x),
          y: interaction.startY + (point.y - interaction.startPointer.y),
        })
        break
      case 'resize':
        updateShape(
          interaction.id,
          computeResize(interaction.rotation, interaction.fixedWorld, point),
        )
        break
      case 'rotate':
        updateShape(interaction.id, {
          rotation: computeRotation(interaction.center, point, event.shiftKey ? 15 : undefined),
        })
        break
    }
  }

  function endInteraction(event: React.PointerEvent<HTMLCanvasElement>): void {
    if (interactionRef.current !== null) {
      interactionRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    }
    updateCursor(event.currentTarget, getCanvasPoint(event))
  }

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    />
  )
}
