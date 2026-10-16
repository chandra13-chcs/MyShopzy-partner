import { createContext, useContext } from 'react'

export type AlertReason = 'played' | 'disabled' | 'blocked' | 'unavailable'

export interface PendingOrderAlert {
  orderId: string
  reason: AlertReason
}

export interface NewOrderAlertsValue {
  alertsEnabled: boolean
  alerts: PendingOrderAlert[]
  dismissAlert: (orderId: string) => void
  setAlertsEnabled: (enabled: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const NewOrderAlertsContext = createContext<
  NewOrderAlertsValue | undefined
>(undefined)

export function useNewOrderAlerts() {
  const context = useContext(NewOrderAlertsContext)
  if (!context) {
    throw new Error(
      'useNewOrderAlerts must be used within a NewOrderAlertsProvider.',
    )
  }
  return context
}
