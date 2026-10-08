export interface AppRoute {
  path: string
  label: string
  title: string
}

export const routes: AppRoute[] = [
  { path: '/', label: 'Home', title: 'Dashboard' },
  { path: '/orders', label: 'Orders', title: 'Orders' },
  { path: '/products', label: 'Products', title: 'Products' },
  { path: '/store', label: 'Store', title: 'Store' },
  { path: '/reports', label: 'Reports', title: 'Reports' },
  { path: '/settings', label: 'More / Settings', title: 'Settings' },
  { path: '/login', label: 'Login', title: 'Partner sign in' },
]

export function resolveRoute(pathname: string): AppRoute {
  return routes.find((route) => route.path === pathname) ?? routes[0]
}
