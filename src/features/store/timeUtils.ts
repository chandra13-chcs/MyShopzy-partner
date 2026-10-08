import type { OperatingHours } from './types'

export function formatTime(value: string) {
  const [hourValue, minute] = value.split(':').map(Number)
  const period = hourValue >= 12 ? 'PM' : 'AM'
  const hour = hourValue % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

export function getTodayHours(hours: OperatingHours) {
  const todayIndex = (new Date().getDay() + 6) % 7
  const today = hours[todayIndex]
  if (!today || !today.enabled) return 'Closed'
  return `${formatTime(today.openingTime)} - ${formatTime(today.closingTime)}`
}
