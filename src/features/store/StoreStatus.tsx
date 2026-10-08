interface StoreStatusProps {
  onToggle: () => void
  storeOpen: boolean
}

export function StoreStatus({ onToggle, storeOpen }: StoreStatusProps) {
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
          <h2>{storeOpen ? 'Your store is OPEN' : 'Your store is CLOSED'}</h2>
          <p>
            {storeOpen
              ? 'Customers can browse your store and place new orders.'
              : 'Customers cannot place new orders while the store is closed.'}
          </p>
        </div>
      </div>
      <button
        aria-pressed={storeOpen}
        className={`store-management-toggle${storeOpen ? ' is-open' : ''}`}
        onClick={onToggle}
        type="button"
      >
        {storeOpen ? 'Close store' : 'Open store'}
      </button>
    </section>
  )
}
