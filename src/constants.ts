export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export const SELECTION_COLOR = '#6366f1'
export const DEFAULT_FILL = '#4f46e5'

export const HANDLE_SIZE = 8
export const HANDLE_HIT_RADIUS = 9
export const ROTATE_HANDLE_OFFSET = 28
export const ROTATE_HANDLE_RADIUS = 6

export const MIN_SIZE = 10

/** Smallest artboard dimension and the minimum font size for text. */
export const MIN_CANVAS_SIZE = 50
export const MIN_FONT_SIZE = 8

/** Artboard size presets offered in the Canvas panel. */
export const CANVAS_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '800 × 600', width: 800, height: 600 },
  { label: 'Square 1080', width: 1080, height: 1080 },
  { label: '1920 × 1080', width: 1920, height: 1080 },
  { label: '1280 × 720', width: 1280, height: 720 },
  { label: 'A4', width: 794, height: 1123 },
]

/** Shape appearance animation (ms) and its starting scale. */
export const APPEAR_MS = 220
export const APPEAR_START_SCALE = 0.85

/** Selection outline fade-in (ms). */
export const SELECT_MS = 130

/** Zoom bounds and the step used by the +/- controls. */
export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 5
export const ZOOM_STEP = 1.2
