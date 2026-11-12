import type { TextShape } from '../types'
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

/** Merges text changes and recomputes the box so it hugs the new content. */
export function textPatchWithBox(
  current: TextShape,
  changes: Partial<Pick<TextShape, 'text' | 'fontSize' | 'bold'>>,
): Partial<Pick<TextShape, 'text' | 'fontSize' | 'bold' | 'width' | 'height'>> {
  const text = changes.text ?? current.text
  const fontSize = changes.fontSize ?? current.fontSize
  const bold = changes.bold ?? current.bold
  return { ...changes, ...measureTextBox(text, fontSize, bold) }
}
