import type { NotificationPreferences } from './types'

export const initialNotificationPreferences: NotificationPreferences = {
  newOrderAlerts: true,
  orderSound: true,
  orderVibration: true,
  pendingOrderReminder: true,
}

export const notificationOptions: {
  key: keyof NotificationPreferences
  label: string
  description: string
}[] = [
  {
    key: 'newOrderAlerts',
    label: 'New order alerts',
    description: 'Show an alert in the partner console when a new order arrives.',
  },
  {
    key: 'orderSound',
    label: 'Order sound',
    description: 'Demo preference for an audible new-order alert.',
  },
  {
    key: 'orderVibration',
    label: 'Order vibration',
    description: 'Demo preference for device vibration on an order alert.',
  },
  {
    key: 'pendingOrderReminder',
    label: 'Pending order reminder',
    description: 'Remind you to review orders that are still pending.',
  },
]
