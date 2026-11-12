import { useEffect, useState } from 'react'
import { IconHelp } from './icons'

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Double-click text', action: 'Edit text' },
  { keys: 'Delete / Backspace', action: 'Delete selection' },
  { keys: 'Arrow keys', action: 'Move selection (Shift = 10px)' },
  { keys: 'Ctrl/Cmd + D', action: 'Duplicate' },
  { keys: 'Ctrl/Cmd + Z', action: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', action: 'Redo' },
  { keys: 'Ctrl/Cmd + scroll', action: 'Zoom to cursor' },
  { keys: 'Ctrl/Cmd + 0', action: 'Reset zoom' },
  { keys: 'Space + drag', action: 'Pan the canvas' },
  { keys: 'Shift while rotating', action: 'Snap to 15°' },
  { keys: '?', action: 'Toggle this panel' },
]

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)
}

export function ShortcutsHelp(): React.JSX.Element {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        return
      }
      if (event.key === '?' && !isTextEntry(event.target)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button
        className="tool-btn"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        data-tooltip="Shortcuts · ?"
      >
        <IconHelp />
      </button>

      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={() => setOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Keyboard shortcuts</h2>
              <button className="tool-btn" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <dl className="shortcut-list">
              {SHORTCUTS.map((shortcut) => (
                <div className="shortcut-row" key={shortcut.keys}>
                  <dt>{shortcut.action}</dt>
                  <dd>
                    <kbd>{shortcut.keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
