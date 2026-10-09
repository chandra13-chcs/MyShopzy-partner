import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  NewOrderAlertsContext,
  type AlertReason,
  type PendingOrderAlert,
} from './NewOrderAlertsContext'
import type { DemoOrder } from './types'

const soundPreferenceKey = 'myshopzy.orderSound.enabled'
const alertedOrderIdsKey = 'myshopzy.orderSound.alertedOrderIds'
const soundSource = '/sounds/new-order.mp3'

function readSoundPreference() {
  try {
    const saved = window.localStorage.getItem(soundPreferenceKey)
    return saved === null ? true : saved === 'true'
  } catch (error) {
    console.warn('Could not read the order sound preference.', error)
    return true
  }
}

function readAlertedOrderIds() {
  try {
    const saved = window.localStorage.getItem(alertedOrderIdsKey)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    if (
      Array.isArray(parsed) &&
      parsed.every((id): id is string => typeof id === 'string')
    ) {
      return new Set(parsed)
    }
  } catch (error) {
    console.warn('Could not read previously alerted order IDs.', error)
  }
  return new Set<string>()
}

async function playNewOrderSound() {
  try {
    const audio = new Audio(soundSource)
    audio.preload = 'auto'
    await audio.play()
    return 'played'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'blocked'
    }
    return 'unavailable'
  }
}

export function NewOrderAlertsProvider({
  children,
  orders,
}: {
  children: ReactNode
  orders: DemoOrder[]
}) {
  const [soundEnabled, setSoundEnabledState] = useState(readSoundPreference)
  const [alerts, setAlerts] = useState<PendingOrderAlert[]>([])
  const knownOrderIds = useRef(new Set(orders.map((order) => order.id)))
  const alertedOrderIds = useRef(readAlertedOrderIds())
  const currentOrders = useRef(orders)

  useEffect(() => {
    currentOrders.current = orders
  }, [orders])

  useEffect(() => {
    try {
      window.localStorage.setItem(soundPreferenceKey, String(soundEnabled))
    } catch (error) {
      console.warn('Could not save the order sound preference.', error)
    }
  }, [soundEnabled])

  useEffect(() => {
    const newPendingOrders = orders.filter((order) => {
      if (knownOrderIds.current.has(order.id)) return false
      knownOrderIds.current.add(order.id)
      return order.status === 'PENDING'
    })

    if (newPendingOrders.length === 0) return

    async function alertForNewOrders() {
      for (const order of newPendingOrders) {
        if (alertedOrderIds.current.has(order.id)) continue
        alertedOrderIds.current.add(order.id)
        try {
          window.localStorage.setItem(
            alertedOrderIdsKey,
            JSON.stringify([...alertedOrderIds.current].slice(-200)),
          )
        } catch (error) {
          console.warn('Could not save the alerted order IDs.', error)
        }

        let reason: AlertReason = 'disabled'
        if (soundEnabled) {
          const playback = await playNewOrderSound()
          if (playback === 'played') continue
          reason = playback
        }
        if (
          !currentOrders.current.some(
            (currentOrder) =>
              currentOrder.id === order.id &&
              currentOrder.status === 'PENDING',
          )
        ) {
          continue
        }

        setAlerts((current) => [
          ...current.filter((alert) => alert.orderId !== order.id),
          { orderId: order.id, reason },
        ])
      }
    }

    void alertForNewOrders()
  }, [orders, soundEnabled])

  function setSoundEnabled(enabled: boolean) {
    setSoundEnabledState(enabled)
  }

  function dismissAlert(orderId: string) {
    setAlerts((current) =>
      current.filter((alert) => alert.orderId !== orderId),
    )
  }

  const pendingOrderIds = new Set(
    orders
      .filter((order) => order.status === 'PENDING')
      .map((order) => order.id),
  )
  const visibleAlerts = alerts.filter((alert) =>
    pendingOrderIds.has(alert.orderId),
  )

  return (
    <NewOrderAlertsContext.Provider
      value={{
        alerts: visibleAlerts,
        dismissAlert,
        setSoundEnabled,
        soundEnabled,
      }}
    >
      {children}
    </NewOrderAlertsContext.Provider>
  )
}
