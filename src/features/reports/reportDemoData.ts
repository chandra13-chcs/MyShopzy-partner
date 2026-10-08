import type { PeriodReportData, ReportPeriod } from './types'

export const periodLabels: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

export const reportDemoData: Record<ReportPeriod, PeriodReportData> = {
  today: {
    summary: {
      totalSales: 790,
      deliveredOrders: 5,
      averageOrderValue: 158,
      rejectedOrders: 1,
    },
    trendTitle: 'Sales today',
    trend: [
      { label: '8 AM', sales: 120 },
      { label: '10 AM', sales: 240 },
      { label: '12 PM', sales: 790 },
      { label: '2 PM', sales: 510 },
      { label: '4 PM', sales: 620 },
      { label: '6 PM', sales: 430 },
      { label: '8 PM', sales: 710 },
    ],
    products: [
      { name: 'Chicken Biryani', orders: 18, sales: 3960, availability: 'Available' },
      { name: 'Paneer Biryani', orders: 12, sales: 2400, availability: 'Available' },
      { name: 'Veg Meals', orders: 10, sales: 1400, availability: 'Available' },
      { name: 'Chicken 65', orders: 8, sales: 1440, availability: 'Out of Stock' },
    ],
    categories: [
      { name: 'Main Course', orders: 30, sales: 6360 },
      { name: 'Starters', orders: 12, sales: 2160 },
      { name: 'Meals', orders: 10, sales: 1400 },
      { name: 'Beverages', orders: 8, sales: 800 },
    ],
  },
  week: {
    summary: {
      totalSales: 10900,
      deliveredOrders: 72,
      averageOrderValue: 151,
      rejectedOrders: 4,
    },
    trendTitle: 'Sales this week',
    trend: [
      { label: 'Mon', sales: 1200 },
      { label: 'Tue', sales: 1450 },
      { label: 'Wed', sales: 980 },
      { label: 'Thu', sales: 1800 },
      { label: 'Fri', sales: 1620 },
      { label: 'Sat', sales: 2100 },
      { label: 'Sun', sales: 1750 },
    ],
    products: [
      { name: 'Chicken Biryani', orders: 82, sales: 18040, availability: 'Available' },
      { name: 'Paneer Biryani', orders: 56, sales: 11200, availability: 'Available' },
      { name: 'Veg Meals', orders: 48, sales: 6720, availability: 'Available' },
      { name: 'Chicken 65', orders: 35, sales: 6300, availability: 'Out of Stock' },
    ],
    categories: [
      { name: 'Main Course', orders: 138, sales: 29240 },
      { name: 'Starters', orders: 44, sales: 7920 },
      { name: 'Meals', orders: 48, sales: 6720 },
      { name: 'Beverages', orders: 39, sales: 3900 },
    ],
  },
  month: {
    summary: {
      totalSales: 42850,
      deliveredOrders: 286,
      averageOrderValue: 150,
      rejectedOrders: 13,
    },
    trendTitle: 'Sales this month',
    trend: [
      { label: 'Week 1', sales: 9200 },
      { label: 'Week 2', sales: 10800 },
      { label: 'Week 3', sales: 9650 },
      { label: 'Week 4', sales: 13200 },
    ],
    products: [
      { name: 'Chicken Biryani', orders: 324, sales: 71280, availability: 'Available' },
      { name: 'Paneer Biryani', orders: 218, sales: 43600, availability: 'Available' },
      { name: 'Veg Meals', orders: 194, sales: 27160, availability: 'Available' },
      { name: 'Chicken 65', orders: 146, sales: 26280, availability: 'Out of Stock' },
    ],
    categories: [
      { name: 'Main Course', orders: 542, sales: 114880 },
      { name: 'Starters', orders: 192, sales: 34560 },
      { name: 'Meals', orders: 194, sales: 27160 },
      { name: 'Beverages', orders: 161, sales: 16100 },
    ],
  },
}
