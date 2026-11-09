/** Shared geometry and shape model for the editor. */

export type ShapeKind = 'rectangle' | 'circle' | 'text'

/** Properties common to every shape on the canvas. */
export interface BaseShape {
  readonly id: string
  kind: ShapeKind
  /** Top-left corner in canvas coordinates. */
  x: number
  y: number
  width: number
  height: number
  /** Clockwise rotation in degrees, around the shape's center. */
  rotation: number
  fill: string
}

export interface RectangleShape extends BaseShape {
  kind: 'rectangle'
}

export interface CircleShape extends BaseShape {
  kind: 'circle'
}

export interface TextShape extends BaseShape {
  kind: 'text'
  text: string
  fontSize: number
}

export type Shape = RectangleShape | CircleShape | TextShape
