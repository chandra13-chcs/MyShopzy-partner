import { useState, type FormEvent } from 'react'
import type { BusinessType } from '../store/types'
import { Dialog } from './Dialog'
import { unitSuggestionsByBusinessType } from './demoData'
import type { Product, ProductCategory, ProductDraft } from './types'

const customUnitOption = '__custom_unit__'

interface ProductFormProps {
  businessType: BusinessType
  categories: ProductCategory[]
  product?: Product
  onCancel: () => void
  onSave: (product: ProductDraft) => void
}

export function ProductForm({
  businessType,
  categories,
  product,
  onCancel,
  onSave,
}: ProductFormProps) {
  const suggestedUnits = unitSuggestionsByBusinessType[businessType].filter(
    (unit, index, units) =>
      units.findIndex(
        (candidate) => candidate.trim().toLowerCase() === unit.trim().toLowerCase(),
      ) === index,
  )
  const initialUnit = product?.unit ?? ''
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [unitChoice, setUnitChoice] = useState(() => {
    if (!initialUnit) return ''
    return suggestedUnits.some(
      (unit) => unit.toLowerCase() === initialUnit.toLowerCase(),
    )
      ? initialUnit
      : customUnitOption
  })
  const [customUnit, setCustomUnit] = useState(() => {
    if (
      initialUnit &&
      !suggestedUnits.some(
        (unit) => unit.toLowerCase() === initialUnit.toLowerCase(),
      )
    ) {
      return initialUnit
    }
    return ''
  })
  const [description, setDescription] = useState(product?.description ?? '')
  const [available, setAvailable] = useState(product?.available ?? true)
  const [stockQuantity, setStockQuantity] = useState(
    String(product?.stockQuantity ?? 0),
  )
  const [restockThreshold, setRestockThreshold] = useState(
    String(product?.restockThreshold ?? 5),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const title = product ? 'Edit product' : 'Add product'
  const selectedSuggestedUnit = suggestedUnits.find(
    (unit) => unit.toLowerCase() === unitChoice.toLowerCase(),
  )
  const unitOptions = suggestedUnits.map((unit) => ({
    value:
      selectedSuggestedUnit === unit && unitChoice !== customUnitOption
        ? unitChoice
        : unit,
    label: unit,
  }))
  if (
    unitChoice &&
    unitChoice !== customUnitOption &&
    !selectedSuggestedUnit
  ) {
    unitOptions.push({ value: unitChoice, label: unitChoice })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedPrice = Number(price)
    const parsedStockQuantity = Number(stockQuantity)
    const parsedRestockThreshold = Number(restockThreshold)
    const savedUnit =
      unitChoice === customUnitOption ? customUnit.trim() : unitChoice.trim()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = 'Enter a product name.'
    if (!categoryId) nextErrors.categoryId = 'Choose a category.'
    if (price.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      nextErrors.price = 'Enter a valid non-negative price.'
    }
    if (
      stockQuantity.trim() === '' ||
      !Number.isInteger(parsedStockQuantity) ||
      parsedStockQuantity < 0
    ) {
      nextErrors.stockQuantity = 'Enter a whole number of 0 or more.'
    }
    if (
      restockThreshold.trim() === '' ||
      !Number.isInteger(parsedRestockThreshold) ||
      parsedRestockThreshold < 1
    ) {
      nextErrors.restockThreshold = 'Enter a whole number of 1 or more.'
    }
    if (unitChoice === customUnitOption && !savedUnit) {
      nextErrors.unit = 'Enter a custom unit or choose a suggestion.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({
      name: name.trim(),
      categoryId,
      price: parsedPrice,
      ...(savedUnit ? { unit: savedUnit } : {}),
      description: description.trim(),
      available: available && parsedStockQuantity > 0,
      stockQuantity: parsedStockQuantity,
      restockThreshold: parsedRestockThreshold,
    })
  }

  return (
    <Dialog labelledBy="product-form-title" onClose={onCancel}>
      <div className="products-dialog-header">
        <div>
          <p className="products-dialog-eyebrow">Product details</p>
          <h2 id="product-form-title">{title}</h2>
        </div>
        <button
          aria-label="Close product form"
          className="products-close-button"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>
      <form className="products-form" noValidate onSubmit={handleSubmit}>
        <label className="products-field">
          <span>Product name <span className="required-mark">*</span></span>
          <input
            aria-describedby={errors.name ? 'product-name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter product name"
            value={name}
          />
          {errors.name && (
            <span className="products-field-error" id="product-name-error">
              {errors.name}
            </span>
          )}
        </label>

        <div className="products-form-row">
          <label className="products-field">
            <span>Category <span className="required-mark">*</span></span>
            <select
              aria-describedby={errors.categoryId ? 'product-category-error' : undefined}
              aria-invalid={Boolean(errors.categoryId)}
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span className="products-field-error" id="product-category-error">
                {errors.categoryId}
              </span>
            )}
          </label>
          <label className="products-field">
            <span>Price (₹) <span className="required-mark">*</span></span>
            <input
              aria-describedby={errors.price ? 'product-price-error' : undefined}
              aria-invalid={Boolean(errors.price)}
              inputMode="decimal"
              min="0"
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
              step="any"
              type="number"
              value={price}
            />
            {errors.price && (
              <span className="products-field-error" id="product-price-error">
                {errors.price}
              </span>
            )}
          </label>
        </div>

        <div className="products-form-row">
          <label className="products-field">
            <span>Unit (optional)</span>
            <select
              onChange={(event) => setUnitChoice(event.target.value)}
              value={unitChoice}
            >
              <option value="">No unit</option>
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
              <option value={customUnitOption}>Custom unit</option>
            </select>
          </label>
          {unitChoice === customUnitOption && (
            <label className="products-field">
              <span>Custom unit</span>
              <input
                aria-describedby={errors.unit ? 'product-unit-error' : undefined}
                aria-invalid={Boolean(errors.unit)}
                onChange={(event) => setCustomUnit(event.target.value)}
                placeholder="e.g. 500 ml"
                value={customUnit}
              />
              {errors.unit && (
                <span className="products-field-error" id="product-unit-error">
                  {errors.unit}
                </span>
              )}
            </label>
          )}
        </div>

        <label className="products-field">
          <span>Description</span>
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a short description (optional)"
            rows={3}
            value={description}
          />
        </label>

        <div className="products-form-row">
          <label className="products-field">
            <span>Stock on hand</span>
            <input
              aria-describedby={errors.stockQuantity ? 'product-stock-error' : undefined}
              aria-invalid={Boolean(errors.stockQuantity)}
              inputMode="numeric"
              min="0"
              onChange={(event) => setStockQuantity(event.target.value)}
              step="1"
              type="number"
              value={stockQuantity}
            />
            {errors.stockQuantity && (
              <span className="products-field-error" id="product-stock-error">
                {errors.stockQuantity}
              </span>
            )}
          </label>
          <label className="products-field">
            <span>Low-stock alert at</span>
            <input
              aria-describedby={
                errors.restockThreshold ? 'product-restock-threshold-error' : undefined
              }
              aria-invalid={Boolean(errors.restockThreshold)}
              inputMode="numeric"
              min="1"
              onChange={(event) => setRestockThreshold(event.target.value)}
              step="1"
              type="number"
              value={restockThreshold}
            />
            {errors.restockThreshold && (
              <span
                className="products-field-error"
                id="product-restock-threshold-error"
              >
                {errors.restockThreshold}
              </span>
            )}
          </label>
        </div>

        <div className="products-field">
          <span>Product image</span>
          <div className="image-placeholder">
            <span aria-hidden="true">＋</span>
            <span>Image placeholder</span>
            <small>Image upload will be available later</small>
          </div>
        </div>

        <label className="availability-control">
          <span className="availability-copy">
            <strong>Available for sale</strong>
            <small>Customers can order this product</small>
          </span>
          <input
            checked={available}
            onChange={(event) => setAvailable(event.target.checked)}
            type="checkbox"
          />
          <span className="availability-switch" aria-hidden="true" />
        </label>

        <div className="products-form-actions">
          <button className="products-button products-button-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="products-button products-button-primary" type="submit">
            Save Product
          </button>
        </div>
      </form>
    </Dialog>
  )
}
