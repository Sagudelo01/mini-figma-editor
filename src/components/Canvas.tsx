import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { Shape } from '../types'
import {
  APPEAR_MS,
  APPEAR_START_SCALE,
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
import { clampPan } from '../lib/view'

interface View {
  zoom: number
  pan: Point
}

type Interaction =
  | { kind: 'move'; id: string; startPointer: Point; startX: number; startY: number }
  | { kind: 'resize'; id: string; rotation: number; fixedWorld: Point }
  | { kind: 'rotate'; id: string; center: Point }
  | { kind: 'pan'; startScreen: Point; startPan: Point }

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

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)
}

function capturePointer(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    // No active pointer to capture (e.g. synthetic events); safe to ignore.
  }
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

// Handle sizes are divided by zoom so the selection UI stays a constant size on
// screen at any zoom level.
function drawSelection(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  alpha: number,
  zoom: number,
): void {
  const line = 1.5 / zoom
  const handle = HANDLE_SIZE / zoom
  const half = handle / 2
  const stem = ROTATE_HANDLE_OFFSET / zoom
  const knob = ROTATE_HANDLE_RADIUS / zoom

  ctx.save()
  ctx.globalAlpha = alpha
  withRotation(ctx, shape, () => {
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = line
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)

    const topCenterX = shape.x + shape.width / 2
    ctx.beginPath()
    ctx.moveTo(topCenterX, shape.y)
    ctx.lineTo(topCenterX, shape.y - stem)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(topCenterX, shape.y - stem, knob, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.stroke()

    const corners: Point[] = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ]
    for (const corner of corners) {
      ctx.beginPath()
      ctx.roundRect(corner.x - half, corner.y - half, handle, handle, 2 / zoom)
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
  const spaceDownRef = useRef(false)

  const shapes = useEditorStore((state) => state.shapes)
  const selectedId = useEditorStore((state) => state.selectedId)
  const background = useEditorStore((state) => state.background)
  const zoom = useEditorStore((state) => state.zoom)
  const pan = useEditorStore((state) => state.pan)
  const viewport = useEditorStore((state) => state.viewport)
  const canvasSize = useEditorStore((state) => state.canvas)
  const selectShape = useEditorStore((state) => state.selectShape)
  const updateShape = useEditorStore((state) => state.updateShape)
  const beginChange = useEditorStore((state) => state.beginChange)
  const setPan = useEditorStore((state) => state.setPan)

  const shapesRef = useRef(shapes)
  const selectedIdRef = useRef(selectedId)
  const backgroundRef = useRef(background)
  const viewRef = useRef<View>({ zoom, pan })
  const viewportRef = useRef(viewport)
  const canvasSizeRef = useRef(canvasSize)

  const appearRef = useRef<Map<string, number>>(new Map())
  const prevIdsRef = useRef<Set<string>>(new Set())
  const selectStartRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const settleRef = useRef<number | null>(null)

  const drawFrame = useCallback((now: number): boolean => {
    const canvas = canvasRef.current
    if (canvas === null) return false
    const ctx = canvas.getContext('2d')
    if (ctx === null) return false

    const dpr = window.devicePixelRatio || 1
    const { w, h } = viewportRef.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const { zoom: z, pan: p } = viewRef.current
    const { width: cw, height: ch } = canvasSizeRef.current
    ctx.translate(p.x, p.y)
    ctx.scale(z, z)

    // Artboard with a soft drop shadow.
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 24 / z
    ctx.shadowOffsetY = 8 / z
    ctx.fillStyle = backgroundRef.current
    ctx.fillRect(0, 0, cw, ch)
    ctx.restore()

    let animating = false

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, cw, ch)
    ctx.clip()
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
    ctx.restore()

    const selected = shapesRef.current.find((shape) => shape.id === selectedIdRef.current)
    if (selected !== undefined) {
      const t = clamp01((now - selectStartRef.current) / SELECT_MS)
      if (t < 1) animating = true
      drawSelection(ctx, selected, easeOutCubic(t), z)
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return animating
  }, [])

  const render = useCallback(() => {
    if (rafRef.current !== null) return
    const loop = (now: number): void => {
      const active = drawFrame(now)
      rafRef.current = active ? requestAnimationFrame(loop) : null
    }
    const active = drawFrame(performance.now())
    if (!active) return
    rafRef.current = requestAnimationFrame(loop)
    // requestAnimationFrame is fully paused while the window is occluded (even
    // though the page still reports "visible"), which would freeze a shape
    // mid-fade. setTimeout still fires, so use it to force the final frame.
    if (settleRef.current !== null) clearTimeout(settleRef.current)
    settleRef.current = window.setTimeout(() => {
      settleRef.current = null
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      drawFrame(performance.now())
    }, APPEAR_MS + 80)
  }, [drawFrame])

  // Keep the canvas backing store matched to its on-screen size.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const apply = (): void => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      useEditorStore.getState().setViewport(w, h)
      render()
    }
    const observer = new ResizeObserver(apply)
    observer.observe(canvas)
    apply()
    return () => {
      observer.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (settleRef.current !== null) clearTimeout(settleRef.current)
      rafRef.current = null
      settleRef.current = null
    }
  }, [render])

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

  useEffect(() => {
    viewRef.current = { zoom, pan }
    viewportRef.current = viewport
    canvasSizeRef.current = canvasSize
    render()
  }, [zoom, pan, viewport, canvasSize, render])

  // Ctrl/Cmd + wheel zooms toward the cursor without zooming the page.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const store = useEditorStore.getState()
      if (event.ctrlKey || event.metaKey) {
        const rect = canvas.getBoundingClientRect()
        const factor = Math.exp(-event.deltaY * 0.0015)
        store.zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top)
        return
      }
      const next = { x: store.pan.x - event.deltaX, y: store.pan.y - event.deltaY }
      store.setPan(clampPan(next, store.zoom, store.viewport, store.canvas))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  // Spacebar toggles the pan ("hand") mode.
  useEffect(() => {
    const canvas = canvasRef.current
    const setCursor = (value: string): void => {
      if (canvas !== null && interactionRef.current === null) canvas.style.cursor = value
    }
    const down = (event: KeyboardEvent): void => {
      if (event.code === 'Space' && !isTextEntry(event.target)) {
        spaceDownRef.current = true
        event.preventDefault()
        setCursor('grab')
      }
    }
    const up = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        spaceDownRef.current = false
        setCursor('default')
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  function getScreenPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function toLogical(screen: Point): Point {
    const { zoom: z, pan: p } = viewRef.current
    return { x: (screen.x - p.x) / z, y: (screen.y - p.y) / z }
  }

  function hitHandle(shape: Shape, point: Point): 'rotate' | CornerId | null {
    const tolerance = HANDLE_HIT_RADIUS / viewRef.current.zoom
    const radiusSq = tolerance * tolerance
    if (
      distanceSquared(point, getRotateHandle(shape, ROTATE_HANDLE_OFFSET / viewRef.current.zoom)) <=
      radiusSq
    ) {
      return 'rotate'
    }
    const corners = getCorners(shape)
    for (const id of Object.keys(corners) as CornerId[]) {
      if (distanceSquared(point, corners[id]) <= radiusSq) return id
    }
    return null
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>): void {
    const screen = getScreenPoint(event)

    if (spaceDownRef.current || event.button === 1) {
      interactionRef.current = {
        kind: 'pan',
        startScreen: screen,
        startPan: { ...viewRef.current.pan },
      }
      capturePointer(event.currentTarget, event.pointerId)
      event.currentTarget.style.cursor = 'grabbing'
      return
    }

    const point = toLogical(screen)
    const selected = shapes.find((shape) => shape.id === selectedId)

    if (selected !== undefined) {
      const handle = hitHandle(selected, point)
      if (handle === 'rotate') {
        beginChange()
        interactionRef.current = { kind: 'rotate', id: selected.id, center: getCenter(selected) }
        capturePointer(event.currentTarget, event.pointerId)
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
        capturePointer(event.currentTarget, event.pointerId)
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
      capturePointer(event.currentTarget, event.pointerId)
    } else {
      selectShape(null)
    }
  }

  function updateCursor(canvas: HTMLCanvasElement, point: Point): void {
    if (spaceDownRef.current) {
      canvas.style.cursor = 'grab'
      return
    }
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
    const screen = getScreenPoint(event)
    const interaction = interactionRef.current

    if (interaction === null) {
      updateCursor(event.currentTarget, toLogical(screen))
      return
    }

    if (interaction.kind === 'pan') {
      const next = {
        x: interaction.startPan.x + (screen.x - interaction.startScreen.x),
        y: interaction.startPan.y + (screen.y - interaction.startScreen.y),
      }
      setPan(clampPan(next, viewRef.current.zoom, viewportRef.current, canvasSizeRef.current))
      return
    }

    const point = toLogical(screen)
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
    updateCursor(event.currentTarget, toLogical(getScreenPoint(event)))
  }

  return (
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    />
  )
}
