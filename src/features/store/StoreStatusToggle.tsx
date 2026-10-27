import type { KeyboardEvent } from 'react'
import './StoreStatusToggle.css'

interface StoreStatusToggleProps {
  isOnline: boolean
  onToggle: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function StoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10h18l-1.6-6H4.6L3 10Zm1 0v10h16V10M8 20v-6h8v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PowerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v9m5.7-5.7a8 8 0 1 1-11.4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function StoreStatusToggle({
  isOnline,
  onToggle,
  size = 'md',
  className = '',
}: StoreStatusToggleProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    if (!event.repeat) onToggle()
  }

  return (
    <div
      className={`store-status-toggle-control store-status-toggle-${size}${className ? ` ${className}` : ''}`}
    >
      <button
        aria-checked={isOnline}
        aria-label={isOnline ? 'Store open' : 'Store closed'}
        className={`store-status-toggle-track${isOnline ? ' is-online' : ''}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        tabIndex={0}
        type="button"
      >
        <span className="store-status-toggle-knob">
          {isOnline ? <StoreIcon /> : <PowerIcon />}
        </span>
      </button>
      <span
        aria-hidden="true"
        className={`store-status-toggle-label${isOnline ? ' is-online' : ''}`}
      >
        {isOnline && <span className="store-status-toggle-pulse" />}
        {isOnline ? 'STORE OPEN' : 'STORE CLOSED'}
      </span>
    </div>
  )
}
