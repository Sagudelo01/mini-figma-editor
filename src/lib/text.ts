import { textFont } from './render'

let cachedCtx: CanvasRenderingContext2D | null | undefined

function getContext(): CanvasRenderingContext2D | null {
  if (cachedCtx === undefined) {
    cachedCtx = document.createElement('canvas').getContext('2d')
  }
  return cachedCtx
}

/** Bounding box a text shape needs for its current content, so the box hugs it. */
export function measureTextBox(
  text: string,
  fontSize: number,
  bold: boolean,
): { width: number; height: number } {
  const content = text.length > 0 ? text : ' '
  const height = Math.ceil(fontSize * 1.3)
  const ctx = getContext()
  if (ctx === null) {
    return { width: Math.ceil(content.length * fontSize * 0.6) || fontSize, height }
  }
  ctx.font = textFont({ fontSize, bold })
  return { width: Math.ceil(ctx.measureText(content).width) + 2, height }
}
