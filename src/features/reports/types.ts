export type ReportPeriod = 'today' | 'week' | 'month'

export interface PeriodSalesSummary {
  totalSales: number
  deliveredOrders: number
  averageOrderValue: number
  rejectedOrders: number
}

export interface SalesTrendPoint {
  label: string
  sales: number
}

export interface PerformanceRow {
  name: string
  orders: number
  sales: number
  availability?: 'Available' | 'Out of Stock'
}

export interface PeriodReportData {
  summary: PeriodSalesSummary
  trendTitle: string
  trend: SalesTrendPoint[]
  products: PerformanceRow[]
  categories: PerformanceRow[]
}
