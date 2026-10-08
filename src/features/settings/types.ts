export interface NotificationPreferences {
  newOrderAlerts: boolean
  orderSound: boolean
  orderVibration: boolean
  pendingOrderReminder: boolean
}

export type SettingsDialogType = 'logout' | 'privacy' | 'terms'
