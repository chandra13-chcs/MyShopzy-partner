import type { PerformanceRow } from './types'

interface ProductPerformanceProps {
  categories: PerformanceRow[]
  products: PerformanceRow[]
  demoMode?: boolean
}

function PerformanceTable({
  rows,
  title,
  description,
  demoMode,
}: {
  rows: PerformanceRow[]
  title: string
  description: string
  demoMode: boolean
}) {
  return (
    <section className="report-panel performance-panel" aria-label={title}>
      <div className="report-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {demoMode && <span className="performance-demo-label">DEMO</span>}
      </div>
      <div className="performance-table-wrap">
        <table className="performance-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Orders</th>
              <th scope="col">Sales</th>
              {rows.some((row) => row.availability) && (
                <th scope="col">Availability</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <span className="performance-name">{row.name}</span>
                  <span className="performance-mobile-orders">{row.orders} orders</span>
                </td>
                <td>{row.orders.toLocaleString('en-IN')}</td>
                <td className="performance-sales">₹{row.sales.toLocaleString('en-IN')}</td>
                {rows.some((item) => item.availability) && (
                  <td>
                    {row.availability && (
                      <span className={`performance-availability${row.availability === 'Available' ? ' is-available' : ' is-out-of-stock'}`}>
                        <span />
                        {row.availability}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="performance-cards">
        {rows.map((row) => (
          <article className="performance-card" key={row.name}>
            <div>
              <h3>{row.name}</h3>
              {row.availability && (
                <span className={`performance-availability${row.availability === 'Available' ? ' is-available' : ' is-out-of-stock'}`}>
                  <span />
                  {row.availability}
                </span>
              )}
            </div>
            <div className="performance-card-stats">
              <span><small>Orders</small><strong>{row.orders.toLocaleString('en-IN')}</strong></span>
              <span><small>Sales</small><strong>₹{row.sales.toLocaleString('en-IN')}</strong></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ProductPerformance({
  categories,
  products,
  demoMode = false,
}: ProductPerformanceProps) {
  const topProduct = products.reduce<PerformanceRow | undefined>(
    (top, product) =>
      product.sales > 0 && (!top || product.sales > top.sales) ? product : top,
    undefined,
  )

  return (
    <div className="performance-area">
      {topProduct && (
        <section className="top-product-highlight" aria-label="Top performing product">
          <span className="top-product-icon" aria-hidden="true">★</span>
          <div className="top-product-name">
            <span>{demoMode ? 'Top product · demo' : 'Top product'}</span>
            <strong>{topProduct.name}</strong>
          </div>
          <div className="top-product-stat">
            <span>Orders</span>
            <strong>{topProduct.orders.toLocaleString('en-IN')}</strong>
          </div>
          <div className="top-product-stat">
            <span>Sales</span>
            <strong>₹{topProduct.sales.toLocaleString('en-IN')}</strong>
          </div>
        </section>
      )}
      <PerformanceTable
        description="Best-selling items for the selected report period."
        demoMode={demoMode}
        rows={products}
        title="Product performance"
      />
      <PerformanceTable
        description="Sales grouped by reusable product category."
        demoMode={demoMode}
        rows={categories}
        title="Category performance"
      />
    </div>
  )
}
