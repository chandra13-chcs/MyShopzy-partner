import { useMemo, useState } from 'react'
import type { DemoOrder } from '../orders/types'
import type { Product } from '../products/types'
import type { ProductCategory } from '../products/types'
import { OrderSummary } from './OrderSummary'
import { ProductPerformance } from './ProductPerformance'
import { ReportFilters } from './ReportFilters'
import { SalesSummary } from './SalesSummary'
import { SalesTrend } from './SalesTrend'
import { ShopOverview } from './ShopOverview'
import type { ReportPeriod } from './types'
import './reports.css'

const periodLabels: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

interface ReportsWorkspaceProps {
  onNavigate: (path: string) => void
  orders: DemoOrder[]
  products: Product[]
  categories: ProductCategory[]
  demoMode?: boolean
}

export default function ReportsWorkspace({
  onNavigate,
  orders,
  products,
  categories,
  demoMode = false,
}: ReportsWorkspaceProps) {
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const data = useMemo(() => {
    const deliveredOrders = orders.filter((order) => order.status === 'COMPLETED')
    const totalSales = deliveredOrders.reduce((total, order) => total + (order.total ?? 0), 0)
    const productCounts = new Map<string, { orders: number; sales: number }>()
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const current = productCounts.get(item.productName) ?? { orders: 0, sales: 0 }
        current.orders += item.quantity ?? 1
        current.sales += (item.quantity ?? 1) * (item.unitPrice ?? 0)
        productCounts.set(item.productName, current)
      }
    }
    const productRows = products.map((product) => ({
      name: product.name,
      orders: productCounts.get(product.name)?.orders ?? 0,
      sales: productCounts.get(product.name)?.sales ?? 0,
      availability: product.available && product.stockQuantity !== 0 ? 'Available' as const : 'Out of Stock' as const,
    }))
    const categoryRows = new Map<string, { orders: number; sales: number }>()
    for (const product of products) {
      const category = categoryRows.get(product.categoryId) ?? { orders: 0, sales: 0 }
      const productData = productCounts.get(product.name)
      category.orders += productData?.orders ?? 0
      category.sales += productData?.sales ?? 0
      categoryRows.set(product.categoryId, category)
    }
    return {
      summary: {
        totalSales,
        deliveredOrders: deliveredOrders.length,
        averageOrderValue: deliveredOrders.length ? totalSales / deliveredOrders.length : 0,
        rejectedOrders: orders.filter((order) => order.status === 'REJECTED').length,
      },
      trendTitle: period === 'today' ? 'Sales today' : period === 'week' ? 'Sales this week' : 'Sales this month',
      trend: deliveredOrders.map((order) => ({
        label: order.id.slice(-4),
        sales: order.total ?? 0,
      })),
      products: productRows,
      categories: categories.map((category) => ({
        name: category.name,
        ...(categoryRows.get(category.id) ?? { orders: 0, sales: 0 }),
      })),
    }
  }, [categories, orders, period, products])

  if (orders.length === 0) {
    return (
      <div className="reports-workspace">
        <div className="reports-page-heading">
          <div>
            <p className="page-eyebrow">Business insights</p>
            <h1>Reports</h1>
            <p className="page-description">A simple overview of sales and order performance.</p>
          </div>
          {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO</span>}
        </div>
        <section className="orders-empty-state" aria-live="polite">
          <h2>No report data yet</h2>
          <p>Reports will appear here after your first order.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="reports-workspace">
      <div className="reports-page-heading">
        <div>
          <p className="page-eyebrow">Business insights</p>
          <h1>Reports</h1>
          <p className="page-description">
            {demoMode
              ? 'A simple overview of sales and order performance.'
              : 'Order and inventory performance from your partner account.'}
          </p>
        </div>
        {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO</span>}
      </div>

      {demoMode ? (
        <>
          <div className="reports-toolbar">
            <div>
              <h2>{periodLabels[period]}</h2>
              <p>Order performance for the selected period</p>
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
            demoMode={demoMode}
          />
        </>
      ) : (
        <>
          <p className="store-form-error" role="note">
            Sales and revenue metrics are unavailable because the partner API does not expose payment confirmation or settlement data.
          </p>
          <OrderSummary orders={orders} />
        </>
      )}
      <ShopOverview
        onNavigate={onNavigate}
        orders={orders}
        products={products}
      />
    </div>
  )
}
