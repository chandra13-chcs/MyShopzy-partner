import { useState, type FormEvent } from 'react'
import { Dialog } from './Dialog'
import type { ProductCategory } from './types'

interface CategoryFormProps {
  category?: ProductCategory
  onCancel: () => void
  onSave: (name: string) => void
}

export function CategoryForm({ category, onCancel, onSave }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Enter a category name.')
      return
    }
    onSave(name.trim())
  }

  return (
    <Dialog labelledBy="category-form-title" onClose={onCancel}>
      <div className="products-dialog-header">
        <div>
          <p className="products-dialog-eyebrow">Organize your menu</p>
          <h2 id="category-form-title">
            {category ? 'Edit category' : 'Add category'}
          </h2>
        </div>
        <button
          aria-label="Close category form"
          className="products-close-button"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>
      <form className="products-form" noValidate onSubmit={handleSubmit}>
        <label className="products-field">
          <span>Category name <span className="required-mark">*</span></span>
          <input
            aria-describedby={error ? 'category-name-error' : undefined}
            aria-invalid={Boolean(error)}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter category name"
            value={name}
          />
          {error && (
            <span className="products-field-error" id="category-name-error">
              {error}
            </span>
          )}
        </label>
        <div className="products-form-actions">
          <button className="products-button products-button-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="products-button products-button-primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </Dialog>
  )
}
