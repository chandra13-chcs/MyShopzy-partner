import type { Product, ProductCategory } from './types'

interface ProductListProps {
  categories: ProductCategory[]
  onAvailabilityChange: (productId: string, available: boolean) => void
  onDelete: (product: Product) => void
  onEdit: (product: Product) => void
  products: Product[]
  isEmptyCatalog?: boolean
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span className={`product-status${available ? ' is-available' : ' is-out-of-stock'}`}>
      <span className="product-status-dot" />
      {available ? 'Available' : 'Out of Stock'}
    </span>
  )
}

function formatProductPrice(product: Product) {
  const price = `₹${product.price.toLocaleString('en-IN')}`
  const unit = product.unit?.trim()
  return unit ? `${price} / ${unit}` : price
}

export function ProductList({
  categories,
  onAvailabilityChange,
  onDelete,
  onEdit,
  products,
  isEmptyCatalog = false,
}: ProductListProps) {
  function categoryName(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name ?? 'Uncategorized'
  }

  return (
    <>
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Stock</th>
              <th scope="col">Availability</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <span className="product-name-cell">{product.name}</span>
                  <span className="product-description-cell">{product.description || '—'}</span>
                </td>
                <td>{categoryName(product.categoryId)}</td>
                <td className="product-price">{formatProductPrice(product)}</td>
                <td>
                  <span className={`product-stock-value${product.stockQuantity <= product.restockThreshold ? ' is-low' : ''}`}>
                    {product.stockQuantity}
                  </span>
                  <span className="product-stock-threshold">
                    Alert at {product.restockThreshold}
                  </span>
                </td>
                <td>
                  <AvailabilityBadge
                    available={product.available && product.stockQuantity > 0}
                  />
                  <label className="sr-only" htmlFor={`availability-${product.id}`}>
                    {product.stockQuantity === 0
                      ? `Add stock before making ${product.name} available`
                      : `Make ${product.name} ${product.available ? 'out of stock' : 'available'}`}
                  </label>
                  <input
                    checked={product.available}
                    className="product-inline-toggle"
                    disabled={product.stockQuantity === 0}
                    id={`availability-${product.id}`}
                    onChange={(event) => onAvailabilityChange(product.id, event.target.checked)}
                    type="checkbox"
                  />
                </td>
                <td>
                  <div className="product-actions">
                    <button
                      aria-label={`Edit ${product.name}`}
                      className="text-action"
                      onClick={() => onEdit(product)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${product.name}`}
                      className="text-action is-danger"
                      onClick={() => onDelete(product)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="product-cards">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card-heading">
              <div>
                <h3>{product.name}</h3>
                <p>{categoryName(product.categoryId)}</p>
              </div>
              <strong>{formatProductPrice(product)}</strong>
            </div>
            <p className="product-card-description">
              {product.description || 'No description provided.'}
            </p>
            <p className={`product-card-stock${product.stockQuantity <= product.restockThreshold ? ' is-low' : ''}`}>
              Stock: <strong>{product.stockQuantity}</strong>
              <span>Alert at {product.restockThreshold}</span>
            </p>
            <div className="product-card-status">
              <AvailabilityBadge
                available={product.available && product.stockQuantity > 0}
              />
              <label className="availability-control compact-control">
                <span className="sr-only">Available for sale</span>
                <input
                  checked={product.available}
                  disabled={product.stockQuantity === 0}
                  onChange={(event) => onAvailabilityChange(product.id, event.target.checked)}
                  type="checkbox"
                />
                <span className="availability-switch" aria-hidden="true" />
              </label>
            </div>
            <div className="product-card-actions">
              <button
                className="products-button products-button-secondary"
                onClick={() => onEdit(product)}
                type="button"
              >
                Edit
              </button>
              <button
                className="products-button products-button-danger"
                onClick={() => onDelete(product)}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {products.length === 0 && (
        <div className="products-empty-state">
          <h3>{isEmptyCatalog ? 'Add your first item' : 'No products found'}</h3>
          <p>{isEmptyCatalog ? 'Your products will appear here once added.' : 'Try another availability filter.'}</p>
        </div>
      )}
    </>
  )
}
