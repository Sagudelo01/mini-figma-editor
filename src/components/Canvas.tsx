import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { Shape } from '../types'
import {
  APPEAR_MS,
  APPEAR_START_SCALE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HANDLE_HIT_RADIUS,
  HANDLE_SIZE,
  ROTATE_HANDLE_OFFSET,
  ROTATE_HANDLE_RADIUS,
  SELECT_MS,
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
import { drawShape, withRotation } from '../lib/render'

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

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

function drawAnimatedShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  scale: number,
  alpha: number,
): void {
  if (scale === 1 && alpha === 1) {
    drawShape(ctx, shape)
    return
  }
  const center = getCenter(shape)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(center.x, center.y)
  ctx.scale(scale, scale)
  ctx.translate(-center.x, -center.y)
  drawShape(ctx, shape)
  ctx.restore()
}

function drawSelection(ctx: CanvasRenderingContext2D, shape: Shape, alpha: number): void {
  ctx.save()
  ctx.globalAlpha = alpha
  withRotation(ctx, shape, () => {
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = 1.5
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)

    // Rotation handle: a stem above the top edge with a grab knob on top.
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
      ctx.beginPath()
      ctx.roundRect(corner.x - half, corner.y - half, HANDLE_SIZE, HANDLE_SIZE, 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.stroke()
    }
  })
  ctx.restore()
}

export function Canvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const interactionRef = useRef<Interaction | null>(null)

  const shapes = useEditorStore((state) => state.shapes)
  const selectedId = useEditorStore((state) => state.selectedId)
  const background = useEditorStore((state) => state.background)
  const selectShape = useEditorStore((state) => state.selectShape)
  const updateShape = useEditorStore((state) => state.updateShape)
  const beginChange = useEditorStore((state) => state.beginChange)

  // Latest values the animation loop reads without re-subscribing; kept in sync
  // from effects (never assigned during render).
  const shapesRef = useRef(shapes)
  const selectedIdRef = useRef(selectedId)
  const backgroundRef = useRef(background)

  const appearRef = useRef<Map<string, number>>(new Map())
  const prevIdsRef = useRef<Set<string>>(new Set())
  const selectStartRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const drawFrame = useCallback((now: number): boolean => {
    const canvas = canvasRef.current
    if (canvas === null) return false
    const ctx = canvas.getContext('2d')
    if (ctx === null) return false

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = backgroundRef.current
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    let animating = false
    for (const shape of shapesRef.current) {
      const start = appearRef.current.get(shape.id)
      if (start === undefined) {
        drawShape(ctx, shape)
        continue
      }
      const t = clamp01((now - start) / APPEAR_MS)
      if (t >= 1) {
        appearRef.current.delete(shape.id)
        drawShape(ctx, shape)
        continue
      }
      animating = true
      const eased = easeOutCubic(t)
      drawAnimatedShape(ctx, shape, APPEAR_START_SCALE + (1 - APPEAR_START_SCALE) * eased, eased)
    }

    const selected = shapesRef.current.find((shape) => shape.id === selectedIdRef.current)
    if (selected !== undefined) {
      const t = clamp01((now - selectStartRef.current) / SELECT_MS)
      if (t < 1) animating = true
      drawSelection(ctx, selected, easeOutCubic(t))
    }

    return animating
  }, [])

  const render = useCallback(() => {
    if (rafRef.current !== null) return
    const loop = (now: number): void => {
      const active = drawFrame(now)
      rafRef.current = active ? requestAnimationFrame(loop) : null
    }
    const active = drawFrame(performance.now())
    if (active) rafRef.current = requestAnimationFrame(loop)
  }, [drawFrame])

  // Size the backing store once for the device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    render()
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [render])

  // Flag newly created shapes so they animate in.
  useEffect(() => {
    shapesRef.current = shapes
    backgroundRef.current = background
    const prev = prevIdsRef.current
    const now = performance.now()
    for (const shape of shapes) {
      if (!prev.has(shape.id)) appearRef.current.set(shape.id, now)
    }
    const ids = new Set(shapes.map((shape) => shape.id))
    for (const id of appearRef.current.keys()) {
      if (!ids.has(id)) appearRef.current.delete(id)
    }
    prevIdsRef.current = ids
    render()
  }, [shapes, background, render])

  useEffect(() => {
    selectedIdRef.current = selectedId
    selectStartRef.current = performance.now()
    render()
  }, [selectedId, render])

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
        beginChange()
        interactionRef.current = { kind: 'rotate', id: selected.id, center: getCenter(selected) }
        event.currentTarget.setPointerCapture(event.pointerId)
        return
      }
      if (handle !== null) {
        beginChange()
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
      beginChange()
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
