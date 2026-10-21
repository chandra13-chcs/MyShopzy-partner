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
    label: 'New-order sound',
    description: 'Play the uploaded alert sound for newly received orders.',
  },
  {
    key: 'orderVibration',
    label: 'Order vibration',
    description: 'Vibrate on a new order alert when supported by the device.',
  },
  {
    key: 'pendingOrderReminder',
    label: 'Pending order reminder',
    description: 'Remind you to review orders that are still pending.',
  },
]
