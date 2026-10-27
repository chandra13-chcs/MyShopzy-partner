import { StoreStatusToggle } from './StoreStatusToggle'

interface StoreStatusProps {
  onToggle: () => void
  storeOpen: boolean
  readOnly?: boolean
  storeStatusLabel?: string
}

export function StoreStatus({
  onToggle,
  storeOpen,
  readOnly = false,
  storeStatusLabel,
}: StoreStatusProps) {
  return (
    <section
      aria-label="Store status"
      className={`store-management-status${storeOpen ? ' is-open' : ' is-closed'}`}
    >
      <div className="store-management-status-copy">
        <span className="store-management-status-icon" aria-hidden="true">
          {storeOpen ? '✓' : '–'}
        </span>
        <div>
          <span className="store-management-eyebrow">Store status</span>
          <h2>
            {readOnly
              ? `Shop status: ${storeStatusLabel || 'unknown'}`
              : storeOpen ? 'Your store is OPEN' : 'Your store is CLOSED'}
          </h2>
          <p>
            {readOnly
              ? 'This is the persisted shop status; operational availability cannot be changed here.'
              : storeOpen
                ? 'Customers can browse your store and place new orders.'
                : 'Customers cannot place new orders while the store is closed.'}
          </p>
        </div>
      </div>
      {!readOnly && (
        <StoreStatusToggle isOnline={storeOpen} onToggle={onToggle} />
      )}
      {readOnly && <small role="note">Availability updates are not supported by the partner API.</small>}
    </section>
  )
}
