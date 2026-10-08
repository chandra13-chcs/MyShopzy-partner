import { useEffect, type ReactNode } from 'react'

interface DialogProps {
  children: ReactNode
  labelledBy: string
  onClose: () => void
}

export function Dialog({ children, labelledBy, onClose }: DialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="products-dialog-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className="products-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </section>
    </div>
  )
}
