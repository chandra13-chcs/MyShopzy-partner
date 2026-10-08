import { useEffect } from 'react'

interface SettingsDialogProps {
  body: string
  onClose: () => void
  title: string
}

export function SettingsDialog({ body, onClose, title }: SettingsDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="settings-dialog-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className="settings-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="settings-dialog-header">
          <h2 id="settings-dialog-title">{title}</h2>
          <button
            aria-label="Close dialog"
            className="settings-dialog-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="settings-dialog-body">{body}</p>
        <div className="settings-dialog-actions">
          <button
            className="settings-button settings-button-primary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  )
}
