import { createContext, useContext } from 'react'

export type AlertReason = 'disabled' | 'blocked' | 'unavailable'

export interface PendingOrderAlert {
  orderId: string
  reason: AlertReason
}

export interface NewOrderAlertsValue {
  alerts: PendingOrderAlert[]
  dismissAlert: (orderId: string) => void
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
