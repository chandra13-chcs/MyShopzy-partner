import type { PeriodSalesSummary } from './types'

interface SalesSummaryProps {
  summary: PeriodSalesSummary
}

export function SalesSummary({ summary }: SalesSummaryProps) {
  const metrics = [
    {
      label: 'Total Sales',
      value: `₹${summary.totalSales.toLocaleString('en-IN')}`,
      note: 'Demo sales for selected period',
      tone: 'sales',
    },
    {
      label: 'Completed Orders',
      value: summary.completedOrders.toLocaleString('en-IN'),
      note: 'Demo report total',
      tone: 'completed',
    },
    {
      label: 'Average Order Value',
      value: `₹${summary.averageOrderValue.toLocaleString('en-IN')}`,
      note: 'Average per completed order',
      tone: 'average',
    },
    {
      label: 'Rejected Orders',
      value: summary.rejectedOrders.toLocaleString('en-IN'),
      note: 'Demo report total',
      tone: 'rejected',
    },
  ]

  return (
    <section aria-label="Sales summary" className="report-summary-grid">
      {metrics.map((metric) => (
        <article className="report-summary-card" key={metric.label}>
          <span className={`report-summary-mark tone-${metric.tone}`} aria-hidden="true">
            {metric.tone === 'sales' ? '₹' : metric.tone === 'completed' ? '✓' : metric.tone === 'average' ? '↗' : '–'}
          </span>
          <p className="report-summary-label">{metric.label}</p>
          <p className="report-summary-value">{metric.value}</p>
          <p className="report-summary-note">{metric.note}</p>
        </article>
      ))}
    </section>
  )
}
