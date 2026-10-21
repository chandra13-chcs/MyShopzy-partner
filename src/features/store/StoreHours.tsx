import { useState } from 'react'
import { formatTime } from './timeUtils'
import type { OperatingHours } from './types'

interface StoreHoursProps {
  onSave: (hours: OperatingHours) => void
  hours: OperatingHours
  readOnly?: boolean
  persistedSchedule?: { open: string; close: string } | null
}

export function StoreHours({
  hours,
  onSave,
  readOnly = false,
  persistedSchedule,
}: StoreHoursProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(hours)

  function startEditing() {
    setDraft(hours.map((day) => ({ ...day })))
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(hours.map((day) => ({ ...day })))
    setEditing(false)
  }

  function updateDay(
    index: number,
    field: 'enabled' | 'openingTime' | 'closingTime',
    value: boolean | string,
  ) {
    setDraft((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index ? { ...day, [field]: value } : day,
      ),
    )
  }

  function saveHours() {
    onSave(draft.map((day) => ({ ...day })))
    setEditing(false)
  }

  return (
    <section className="store-section store-hours-section" aria-labelledby="store-hours-heading">
      <div className="store-section-heading">
        <div>
          <h2 id="store-hours-heading">Operating hours</h2>
          <p>
            {readOnly
              ? 'The backend supports one daily opening and closing time.'
              : 'Set the hours customers can visit your store.'}
          </p>
        </div>
        {!editing && !readOnly && (
          <button
            className="store-secondary-button"
            onClick={startEditing}
            type="button"
          >
            Edit hours
          </button>
        )}
      </div>

      {readOnly ? (
        <div className="store-hours-list" aria-live="polite">
          <div className="store-hour-row">
            <span className="store-hour-day">Daily</span>
            <span className="store-hours-value">
              {persistedSchedule
                ? `${formatTime(persistedSchedule.open)} – ${formatTime(persistedSchedule.close)}`
                : 'Not configured; backend defaults are 07:00–23:00.'}
            </span>
          </div>
        </div>
      ) : <div className="store-hours-list">
        {draft.map((day, index) => (
          <div className={`store-hour-row${!day.enabled ? ' is-disabled' : ''}`} key={day.day}>
            <span className="store-hour-day">{day.day}</span>
            {editing ? (
              <>
                <label className="store-day-toggle">
                  <input
                    aria-label={`${day.day} enabled`}
                    checked={day.enabled}
                    onChange={(event) => updateDay(index, 'enabled', event.target.checked)}
                    type="checkbox"
                  />
                  <span className="store-switch" aria-hidden="true" />
                  <span className="store-day-toggle-label">{day.enabled ? 'Open' : 'Closed'}</span>
                </label>
                <div className="store-time-inputs">
                  <label>
                    <span className="store-visually-hidden">{day.day} opening time</span>
                    <input
                      aria-label={`${day.day} opening time`}
                      disabled={!day.enabled}
                      onChange={(event) => updateDay(index, 'openingTime', event.target.value)}
                      type="time"
                      value={day.openingTime}
                    />
                  </label>
                  <span className="store-time-separator">to</span>
                  <label>
                    <span className="store-visually-hidden">{day.day} closing time</span>
                    <input
                      aria-label={`${day.day} closing time`}
                      disabled={!day.enabled}
                      onChange={(event) => updateDay(index, 'closingTime', event.target.value)}
                      type="time"
                      value={day.closingTime}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <span className={`store-hours-day-state${day.enabled ? '' : ' is-closed'}`}>
                  {day.enabled ? 'Open' : 'Closed'}
                </span>
                <span className="store-hours-value">
                  {day.enabled
                    ? `${formatTime(day.openingTime)} – ${formatTime(day.closingTime)}`
                    : 'Closed all day'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>}

      {editing && !readOnly && (
        <div className="store-form-actions store-hours-actions">
          <button
            className="store-secondary-button"
            onClick={cancelEditing}
            type="button"
          >
            Cancel
          </button>
          <button className="store-primary-button" onClick={saveHours} type="button">
            Save hours
          </button>
        </div>
      )}
    </section>
  )
}
