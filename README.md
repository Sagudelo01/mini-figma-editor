# Mini Figma

A small Figma-like visual editor built with React, TypeScript and an HTML5 canvas. Create rectangles, circles and text, then move, resize and rotate them, tweak their properties, undo/redo your work and export the result as a PNG.

## Features

- **Shapes** — add rectangles, circles and text to the canvas.
- **Selection** — click to select the topmost shape under the cursor; click empty space to deselect.
- **Transform** — drag a shape to move it, drag the corner handles to resize, and drag the rotation handle to rotate. Resizing and rotation are fully rotation-aware, so a rotated shape still scales along its own axes.
- **Properties panel** — edit the selected shape's X, Y, width, height, rotation and fill color, with live updates on the canvas.
- **Delete** — remove the selected shape from the panel or with the keyboard.
- **Undo / redo** — history with per-gesture granularity, available from the toolbar and keyboard.
- **Export** — download the canvas as a 2× PNG.

## Keyboard shortcuts

| Action        | Shortcut                             |
| ------------- | ------------------------------------ |
| Undo          | `Ctrl/Cmd + Z`                       |
| Redo          | `Ctrl/Cmd + Shift + Z` or `Ctrl + Y` |
| Delete shape  | `Delete` or `Backspace`              |
| Snap rotation | Hold `Shift` while rotating (15°)    |

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) in strict mode (no `any`)
- [Vite](https://vite.dev/) for dev server and builds
- [Zustand](https://github.com/pmndrs/zustand) for state management
- HTML5 Canvas 2D for rendering
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) for tests
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## Getting started

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

### Production build

```bash
npm run build     # type-check and bundle into dist/
npm run preview   # serve the production build locally
```

## Scripts

| Script                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the Vite dev server with HMR             |
| `npm run build`        | Type-check (`tsc -b`) and build for production |
| `npm run preview`      | Preview the production build                   |
| `npm test`             | Run the test suite in watch mode               |
| `npm run test:run`     | Run the test suite once                        |
| `npm run coverage`     | Run tests with a coverage report               |
| `npm run lint`         | Lint with ESLint                               |
| `npm run format`       | Format the codebase with Prettier              |
| `npm run format:check` | Check formatting without writing               |

## Testing

Tests run on Vitest with a jsdom environment and React Testing Library. They cover the geometry and transform math (including rotated hit-testing and resizing), the Zustand store (create / update / delete and undo/redo), and the UI components.

```bash
npm run test:run
```

## Project structure

```
src/
├── components/
│   ├── Canvas.tsx            # canvas rendering + pointer interactions
│   ├── Toolbar.tsx           # create shapes, undo/redo, export
│   └── PropertiesPanel.tsx   # edit the selected shape
├── lib/
│   ├── geometry.ts           # centers, corners, rotation-aware hit testing
│   ├── transform.ts          # resize and rotation math
│   ├── render.ts             # shared shape drawing
│   └── exportPng.ts          # PNG export
├── store/
│   └── useEditorStore.ts     # Zustand store with history
├── constants.ts
└── types.ts
```

## How it works

Shapes are plain data in a Zustand store (position, size, rotation and fill). The canvas redraws the whole scene on every state change, applying each shape's rotation around its center. Pointer interactions are translated into store updates: hit-testing maps the pointer into each shape's local, unrotated space so selection, resizing and rotation behave correctly at any angle. History snapshots are taken at the start of each gesture, so a single undo reverts a complete move, resize or rotate.

## License

MIT
