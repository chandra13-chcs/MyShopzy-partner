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
const alertsPreferenceKey = 'myshopzy.orderAlerts.enabled'
const alertedOrderIdsKey = 'myshopzy.orderSound.alertedOrderIds'
const soundSource = '/sounds/new-order.mp3'
const newOrderSoundDurationMs = 7_000

function requestSystemNotificationPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') {
    return
  }

  void Notification.requestPermission().catch((error: unknown) => {
    console.warn('Could not request browser notification permission.', error)
  })
}

function showBackgroundOrderNotification(orderId: string) {
  if (
    document.visibilityState === 'visible' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  try {
    const notification = new Notification('New order received', {
      body: `Order #${orderId} is waiting for your review.`,
      tag: `myshopzy-order-${orderId}`,
    })
    const timeout = window.setTimeout(() => notification.close(), newOrderSoundDurationMs)
    notification.onclick = () => {
      window.clearTimeout(timeout)
      notification.close()
      window.focus()
    }
  } catch (error) {
    console.warn(`Could not show a browser notification for order ${orderId}.`, error)
  }
}

function readAlertsPreference() {
  try {
    const saved = window.localStorage.getItem(alertsPreferenceKey)
    return saved === null ? true : saved === 'true'
  } catch (error) {
    console.warn('Could not read the order alert preference.', error)
    return true
  }
}

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

function stopOrderSound(
  orderId: string,
  activeAudio: Map<string, HTMLAudioElement>,
  audioTimeouts: Map<string, number>,
) {
  const timeout = audioTimeouts.get(orderId)
  if (timeout !== undefined) {
    window.clearTimeout(timeout)
    audioTimeouts.delete(orderId)
  }
  const audio = activeAudio.get(orderId)
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
  activeAudio.delete(orderId)
}

async function playNewOrderSound(
  orderId: string,
  activeAudio: Map<string, HTMLAudioElement>,
  audioTimeouts: Map<string, number>,
): Promise<AlertReason | undefined> {
  if (activeAudio.has(orderId)) return 'played'

  let audio: HTMLAudioElement | undefined
  try {
    audio = new Audio(soundSource)
    audio.preload = 'auto'
    audio.loop = true
    activeAudio.set(orderId, audio)
    await audio.play()
    if (activeAudio.get(orderId) !== audio) return undefined
    audioTimeouts.set(
      orderId,
      window.setTimeout(
        () => stopOrderSound(orderId, activeAudio, audioTimeouts),
        newOrderSoundDurationMs,
      ),
    )
    return 'played'
  } catch (error) {
    if (audio && activeAudio.get(orderId) !== audio) return undefined
    if (audio && activeAudio.get(orderId) === audio) {
      activeAudio.delete(orderId)
    }
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'blocked'
    }
    console.warn(`Could not play the alert sound for order ${orderId}.`, error)
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
  const [alertsEnabled, setAlertsEnabledState] = useState(readAlertsPreference)
  const alertsEnabledRef = useRef(alertsEnabled)
  const [soundEnabled, setSoundEnabledState] = useState(readSoundPreference)
  const soundEnabledRef = useRef(soundEnabled)
  const [alerts, setAlerts] = useState<PendingOrderAlert[]>([])
  const knownOrderIds = useRef(new Set(orders.map((order) => order.id)))
  const pendingAlertOrderIds = useRef(new Set<string>())
  const blockedAudioOrderIds = useRef(new Set<string>())
  const alertedOrderIds = useRef(readAlertedOrderIds())
  const currentOrders = useRef(orders)
  const previousOrderStatuses = useRef(
    new Map(orders.map((order) => [order.id, order.status])),
  )
  const activeAudio = useRef(new Map<string, HTMLAudioElement>())
  const audioTimeouts = useRef(new Map<string, number>())

  useEffect(() => {
    currentOrders.current = orders
    const previousStatuses = previousOrderStatuses.current
    for (const order of orders) {
      const isNewOrder = !knownOrderIds.current.has(order.id)
      const previousStatus = previousStatuses.get(order.id)
      if (isNewOrder) {
        knownOrderIds.current.add(order.id)
      }
      if (
        order.status === 'PENDING' &&
        (isNewOrder || (previousStatus !== undefined && previousStatus !== 'PENDING'))
      ) {
        pendingAlertOrderIds.current.add(order.id)
      }

      if (
        previousStatus === 'PENDING' &&
        order.status !== 'PENDING'
      ) {
        stopOrderSound(order.id, activeAudio.current, audioTimeouts.current)
        pendingAlertOrderIds.current.delete(order.id)
        setAlerts((current) =>
          current.filter((alert) => alert.orderId !== order.id),
        )
      }
      previousStatuses.set(order.id, order.status)
    }

    for (const orderId of pendingAlertOrderIds.current) {
      const order = orders.find(
        (currentOrder) =>
          currentOrder.id === orderId && currentOrder.status === 'PENDING',
      )
      if (!order) {
        pendingAlertOrderIds.current.delete(orderId)
        continue
      }
      if (alertedOrderIds.current.has(orderId)) {
        pendingAlertOrderIds.current.delete(orderId)
        continue
      }
      if (!alertsEnabled) continue

      pendingAlertOrderIds.current.delete(orderId)
      alertedOrderIds.current.add(orderId)
      while (alertedOrderIds.current.size > 200) {
        const oldestId = alertedOrderIds.current.values().next().value
        if (oldestId === undefined) break
        alertedOrderIds.current.delete(oldestId)
      }
      try {
        window.localStorage.setItem(
          alertedOrderIdsKey,
          JSON.stringify([...alertedOrderIds.current]),
        )
      } catch (error) {
        console.warn('Could not save the alerted order IDs.', error)
      }

      setAlerts((current) => [
        ...current.filter((alert) => alert.orderId !== orderId),
        {
          orderId,
          reason: soundEnabled ? 'played' : 'disabled',
        },
      ])
      showBackgroundOrderNotification(orderId)

      if (soundEnabled) {
        void playNewOrderSound(
          orderId,
          activeAudio.current,
          audioTimeouts.current,
        ).then((reason) => {
          if (reason === undefined) return
          if (reason === 'blocked') {
            blockedAudioOrderIds.current.add(orderId)
          } else {
            blockedAudioOrderIds.current.delete(orderId)
          }
          if (
            reason === 'played' ||
            !alertsEnabledRef.current ||
            !soundEnabledRef.current ||
            !currentOrders.current.some(
              (currentOrder) =>
                currentOrder.id === orderId &&
                currentOrder.status === 'PENDING',
            )
          ) {
            return
          }
          setAlerts((current) =>
            current.map((alert) =>
              alert.orderId === orderId ? { ...alert, reason } : alert,
            ),
          )
        })
      }
    }
  }, [alertsEnabled, orders, soundEnabled])

  useEffect(
    () => () => {
      for (const audio of activeAudio.current.values()) {
        audio.pause()
        audio.currentTime = 0
      }
      activeAudio.current.clear()
      for (const timeout of audioTimeouts.current.values()) {
        window.clearTimeout(timeout)
      }
      audioTimeouts.current.clear()
    },
    [],
  )

  useEffect(() => {
    function synchronizePreferences(event: StorageEvent) {
      if (event.key === alertsPreferenceKey && event.newValue !== null) {
        const enabled = event.newValue === 'true'
        alertsEnabledRef.current = enabled
        setAlertsEnabledState(enabled)
        if (!enabled) {
          setAlerts([])
          blockedAudioOrderIds.current.clear()
          for (const orderId of activeAudio.current.keys()) {
            stopOrderSound(orderId, activeAudio.current, audioTimeouts.current)
          }
        }
      }
      if (event.key === soundPreferenceKey && event.newValue !== null) {
        const enabled = event.newValue === 'true'
        soundEnabledRef.current = enabled
        setSoundEnabledState(enabled)
        if (!enabled) {
          blockedAudioOrderIds.current.clear()
          for (const orderId of activeAudio.current.keys()) {
            stopOrderSound(orderId, activeAudio.current, audioTimeouts.current)
          }
        }
      }
    }

    window.addEventListener('storage', synchronizePreferences)
    return () => window.removeEventListener('storage', synchronizePreferences)
  }, [])

  useEffect(() => {
    function retryPendingOrderSounds() {
      for (const orderId of blockedAudioOrderIds.current) {
        const order = currentOrders.current.find(
          (currentOrder) =>
            currentOrder.id === orderId && currentOrder.status === 'PENDING',
        )
        if (!order) {
          blockedAudioOrderIds.current.delete(orderId)
          continue
        }
        if (
          activeAudio.current.has(orderId) ||
          !alertsEnabledRef.current ||
          !soundEnabledRef.current
        ) {
          continue
        }
        void playNewOrderSound(
          orderId,
          activeAudio.current,
          audioTimeouts.current,
        ).then((reason) => {
          if (reason === undefined || reason === 'blocked') return
          blockedAudioOrderIds.current.delete(orderId)
          setAlerts((current) =>
            current.map((alert) =>
              alert.orderId === orderId ? { ...alert, reason } : alert,
            ),
          )
        })
      }
    }

    window.addEventListener('pointerdown', retryPendingOrderSounds, true)
    window.addEventListener('keydown', retryPendingOrderSounds, true)
    return () => {
      window.removeEventListener('pointerdown', retryPendingOrderSounds, true)
      window.removeEventListener('keydown', retryPendingOrderSounds, true)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(alertsPreferenceKey, String(alertsEnabled))
    } catch (error) {
      console.warn('Could not save the order alert preference.', error)
    }
  }, [alertsEnabled])

  useEffect(() => {
    try {
      window.localStorage.setItem(soundPreferenceKey, String(soundEnabled))
    } catch (error) {
      console.warn('Could not save the order sound preference.', error)
    }
  }, [soundEnabled])

  function setAlertsEnabled(enabled: boolean) {
    alertsEnabledRef.current = enabled
    setAlertsEnabledState(enabled)
    if (enabled) requestSystemNotificationPermission()
    if (!enabled) {
      setAlerts([])
      blockedAudioOrderIds.current.clear()
      for (const orderId of activeAudio.current.keys()) {
        stopOrderSound(orderId, activeAudio.current, audioTimeouts.current)
      }
    }
  }

  function setSoundEnabled(enabled: boolean) {
    soundEnabledRef.current = enabled
    setSoundEnabledState(enabled)
    if (!enabled) {
      for (const orderId of activeAudio.current.keys()) {
        stopOrderSound(orderId, activeAudio.current, audioTimeouts.current)
      }
      blockedAudioOrderIds.current.clear()
      setAlerts((current) =>
        current.map((alert) => ({ ...alert, reason: 'disabled' })),
      )
      return
    }

    for (const order of currentOrders.current) {
      if (
        order.status !== 'PENDING' ||
        !alertedOrderIds.current.has(order.id) ||
        activeAudio.current.has(order.id) ||
        !alertsEnabledRef.current
      ) {
        continue
      }
      void playNewOrderSound(
        order.id,
        activeAudio.current,
        audioTimeouts.current,
      ).then((reason) => {
        if (reason === undefined) return
        if (reason === 'blocked') {
          blockedAudioOrderIds.current.add(order.id)
        } else {
          blockedAudioOrderIds.current.delete(order.id)
        }
        setAlerts((current) =>
          current.map((alert) =>
            alert.orderId === order.id ? { ...alert, reason } : alert,
          ),
        )
      })
    }
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
        alertsEnabled,
        alerts: visibleAlerts,
        dismissAlert,
        setAlertsEnabled,
        setSoundEnabled,
        soundEnabled,
      }}
    >
      {children}
    </NewOrderAlertsContext.Provider>
  )
}
