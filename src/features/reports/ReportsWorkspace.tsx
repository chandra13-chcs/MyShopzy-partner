import { useState } from 'react'
import type { DemoOrder } from '../orders/types'
import { OrderSummary } from './OrderSummary'
import { ProductPerformance } from './ProductPerformance'
import { ReportFilters } from './ReportFilters'
import { reportDemoData, periodLabels } from './reportDemoData'
import { SalesSummary } from './SalesSummary'
import { SalesTrend } from './SalesTrend'
import type { ReportPeriod } from './types'
import './reports.css'

interface ReportsWorkspaceProps {
  orders: DemoOrder[]
}

export default function ReportsWorkspace({ orders }: ReportsWorkspaceProps) {
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const data = reportDemoData[period]

  return (
    <div className="reports-workspace">
      <div className="reports-page-heading">
        <div>
          <p className="page-eyebrow">Business insights</p>
          <h1>Reports</h1>
          <p className="page-description">
            A simple overview of sales and order performance.
          </p>
        </div>
        <span className="demo-tag demo-tag-large">LOCAL DEMO</span>
      </div>

      <div className="reports-toolbar">
        <div>
          <h2>{periodLabels[period]}</h2>
          <p>Demo report values for the selected period</p>
        </div>
        <ReportFilters onChange={setPeriod} period={period} />
      </div>

      <SalesSummary summary={data.summary} />

      <div className="reports-overview-grid">
        <SalesTrend points={data.trend} title={data.trendTitle} />
        <OrderSummary orders={orders} />
      </div>

      <ProductPerformance
        categories={data.categories}
        products={data.products}
      />
    </div>
  )
}
