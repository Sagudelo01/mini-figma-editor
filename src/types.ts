export type ShapeKind = 'rectangle' | 'circle' | 'text'

export interface BaseShape {
  readonly id: string
  kind: ShapeKind
  // x/y is the top-left corner; rotation is clockwise degrees about the center.
  x: number
  y: number
  width: number
  height: number
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
