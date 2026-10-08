import type { SalesTrendPoint } from './types'

interface SalesTrendProps {
  points: SalesTrendPoint[]
  title: string
}

function formatChartValue(sales: number) {
  if (sales >= 1000) return `₹${(sales / 1000).toFixed(1)}k`
  return `₹${sales.toLocaleString('en-IN')}`
}

export function SalesTrend({ points, title }: SalesTrendProps) {
  const highestSales = Math.max(...points.map((point) => point.sales), 1)

  return (
    <section className="report-panel sales-trend-panel" aria-labelledby="sales-trend-heading">
      <div className="report-panel-heading">
        <div>
          <h2 id="sales-trend-heading">Sales trend</h2>
          <p>{title} · demo values</p>
        </div>
        <span className="sales-trend-legend"><span /> Sales</span>
      </div>
      <div
        aria-label={points.map((point) => `${point.label}: ₹${point.sales.toLocaleString('en-IN')}`).join(', ')}
        className="sales-chart"
        role="img"
      >
        {points.map((point) => (
          <div className="sales-chart-column" key={point.label}>
            <span className="sales-chart-value">
              {formatChartValue(point.sales)}
            </span>
            <div className="sales-chart-track">
              <span
                className="sales-chart-bar"
                style={{ height: `${Math.max((point.sales / highestSales) * 100, 5)}%` }}
              />
            </div>
            <span className="sales-chart-label">{point.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
