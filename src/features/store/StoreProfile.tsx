import { useState, type FormEvent } from 'react'
import { businessTypes } from './storeDemoData'
import type { StoreProfile as StoreProfileData } from './types'

interface StoreProfileProps {
  onSave: (profile: StoreProfileData) => void
  profile: StoreProfileData
}

export function StoreProfile({ onSave, profile }: StoreProfileProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')

  function startEditing() {
    setDraft(profile)
    setError('')
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(profile)
    setError('')
    setEditing(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.businessName.trim() || !draft.phone.trim() || !draft.address.trim()) {
      setError('Business name, phone number, and store address are required.')
      return
    }
    onSave({
      ...draft,
      businessName: draft.businessName.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
      description: draft.description.trim(),
    })
    setEditing(false)
    setError('')
  }

  function updateField<K extends keyof StoreProfileData>(
    field: K,
    value: StoreProfileData[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="store-section" aria-labelledby="store-profile-heading">
      <div className="store-section-heading">
        <div>
          <h2 id="store-profile-heading">Business profile</h2>
          <p>Keep your store information up to date.</p>
        </div>
        {!editing && (
          <button
            className="store-secondary-button"
            onClick={startEditing}
            type="button"
          >
            Edit profile
          </button>
        )}
      </div>

      {editing ? (
        <form className="store-profile-form" noValidate onSubmit={handleSubmit}>
          <label className="store-field">
            <span>Business name <b>*</b></span>
            <input
              aria-label="Business Name"
              autoComplete="organization"
              onChange={(event) => updateField('businessName', event.target.value)}
              required
              value={draft.businessName}
            />
          </label>
          <label className="store-field">
            <span>Business type</span>
            <select
              aria-label="Business Type"
              onChange={(event) => {
                const businessType = businessTypes.find(
                  (type) => type === event.target.value,
                )
                if (businessType) updateField('businessType', businessType)
              }}
              value={draft.businessType}
            >
              {businessTypes.map((businessType) => (
                <option key={businessType} value={businessType}>
                  {businessType}
                </option>
              ))}
            </select>
          </label>
          <label className="store-field">
            <span>Phone number <b>*</b></span>
            <input
              aria-label="Phone Number"
              autoComplete="tel"
              onChange={(event) => updateField('phone', event.target.value)}
              required
              type="tel"
              value={draft.phone}
            />
          </label>
          <label className="store-field">
            <span>Store address <b>*</b></span>
            <input
              aria-label="Store Address"
              autoComplete="street-address"
              onChange={(event) => updateField('address', event.target.value)}
              required
              value={draft.address}
            />
          </label>
          <label className="store-field store-field-full">
            <span>Description</span>
            <textarea
              aria-label="Description"
              onChange={(event) => updateField('description', event.target.value)}
              rows={3}
              value={draft.description}
            />
          </label>
          {error && <p className="store-form-error" role="alert">{error}</p>}
          <div className="store-form-actions store-field-full">
            <button
              className="store-secondary-button"
              onClick={cancelEditing}
              type="button"
            >
              Cancel
            </button>
            <button className="store-primary-button" type="submit">
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <dl className="store-profile-details">
          <div>
            <dt>Business name</dt>
            <dd>{profile.businessName}</dd>
          </div>
          <div>
            <dt>Business type</dt>
            <dd>{profile.businessType}</dd>
          </div>
          <div>
            <dt>Phone number</dt>
            <dd>{profile.phone}</dd>
          </div>
          <div>
            <dt>Store address</dt>
            <dd>{profile.address}</dd>
          </div>
          <div className="store-profile-description">
            <dt>Description</dt>
            <dd>{profile.description || 'No description added.'}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
