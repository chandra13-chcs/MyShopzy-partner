import { useState, type FormEvent } from 'react'
import type { PartnerTypeConfig } from '../../config/partnerTypes'
import { Dialog } from './Dialog'
import type { Product, ProductCategory, ProductDraft, ProductVariant } from './types'

type VariantInput = { label: string; unit: string; quantity: string; price: string; stock: string }

interface ProductFormProps {
  allowedUnits: string[]
  extraFields: PartnerTypeConfig['extraProductFields']
  categories: ProductCategory[]
  product?: Product
  onCancel: () => void
  onSave: (product: ProductDraft) => void
}

export function ProductForm({
  allowedUnits,
  extraFields,
  categories,
  product,
  onCancel,
  onSave,
}: ProductFormProps) {
  const suggestedUnits = allowedUnits
  const initialUnit = product?.unit ?? ''
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [unitChoice, setUnitChoice] = useState(() => {
    if (!initialUnit) return ''
    return suggestedUnits.find(
      (unit) => unit.toLowerCase() === initialUnit.toLowerCase(),
    ) ?? ''
  })
  const [description, setDescription] = useState(product?.description ?? '')
  const [available, setAvailable] = useState(product?.available ?? true)
  const [stockQuantity, setStockQuantity] = useState(
    String(product?.stockQuantity ?? 0),
  )
  const [restockThreshold, setRestockThreshold] = useState(
    String(product?.restockThreshold ?? 5),
  )
  const [extraValues, setExtraValues] = useState<Record<string, string | number | boolean>>(
    product?.extraFields ?? {},
  )
  const [variants, setVariants] = useState<VariantInput[]>(() =>
    product?.variants?.length
      ? product.variants.map((variant) => ({
          label: variant.label,
          unit: variant.unit,
          quantity: String(variant.quantity),
          price: String(variant.price),
          stock: String(variant.stock),
        }))
      : [{ label: 'Regular', unit: suggestedUnits[0] ?? '', quantity: '1', price: '0', stock: '0' }],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const title = product ? 'Edit product' : 'Add product'
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedPrice = Number(price)
    const parsedStockQuantity = Number(stockQuantity)
    const parsedRestockThreshold = Number(restockThreshold)
    const savedUnit = unitChoice.trim()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = 'Enter a product name.'
    if (name.trim().length > 80) nextErrors.name = 'Product name must be 80 characters or fewer.'
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
    const variantLabels = variants.map((variant) => variant.label.trim().toLocaleLowerCase())
    if (variants.length < 1 || variants.length > 8) {
      nextErrors.variants = 'Add between 1 and 8 variants.'
    } else if (variants.some((variant) => !variant.label.trim() || variant.label.trim().length > 20)) {
      nextErrors.variants = 'Each variant needs a label of 1 to 20 characters.'
    } else if (new Set(variantLabels).size !== variantLabels.length) {
      nextErrors.variants = 'Variant labels must be unique.'
    } else if (variants.some((variant) =>
      !suggestedUnits.includes(variant.unit) ||
      !Number.isFinite(Number(variant.quantity)) || Number(variant.quantity) <= 0 ||
      !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0 ||
      !Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0,
    )) {
      nextErrors.variants = 'Enter a valid unit, quantity, price, and stock for each variant.'
    }
    for (const field of extraFields) {
      const value = extraValues[field.key]
      if (field.required && (value === undefined || value === '')) {
        nextErrors[`extra-${field.key}`] = `Enter ${field.label.toLowerCase()}.`
      }
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
      extraFields: extraValues,
      variants: variants.map((variant): ProductVariant => ({
        label: variant.label.trim(),
        unit: variant.unit,
        quantity: Number(variant.quantity),
        price: Number(variant.price),
        stock: Number(variant.stock),
      })),
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
            maxLength={80}
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
              {suggestedUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
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

        {extraFields.map((field) => (
          <label className="products-field" key={field.key}>
            <span>{field.label}{field.required && <> <span className="required-mark">*</span></>}</span>
            {field.type === 'boolean' ? (
              <input
                checked={Boolean(extraValues[field.key])}
                onChange={(event) => setExtraValues((current) => ({ ...current, [field.key]: event.target.checked }))}
                type="checkbox"
              />
            ) : field.type === 'select' ? (
              <select
                onChange={(event) => setExtraValues((current) => ({ ...current, [field.key]: event.target.value }))}
                value={String(extraValues[field.key] ?? '')}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input
                onChange={(event) => setExtraValues((current) => ({
                  ...current,
                  [field.key]: field.type === 'number' && event.target.value !== ''
                    ? Number(event.target.value)
                    : event.target.value,
                }))}
                type={field.type}
                value={String(extraValues[field.key] ?? '')}
              />
            )}
            {errors[`extra-${field.key}`] && (
              <span className="products-field-error">{errors[`extra-${field.key}`]}</span>
            )}
          </label>
        ))}

        <section className="products-variants" aria-labelledby="product-variants-heading">
          <div className="products-variants-heading">
            <h3 id="product-variants-heading">Variants</h3>
            <button
              className="products-button products-button-secondary"
              disabled={variants.length >= 8}
              onClick={() => setVariants((current) => [...current, {
                label: '', unit: suggestedUnits[0] ?? '', quantity: '1', price: '0', stock: '0',
              }])}
              type="button"
            >
              Add variant
            </button>
          </div>
          {variants.map((variant, index) => (
            <div className="products-variant-row" key={index}>
              <label className="products-field">
                <span>Label</span>
                <input maxLength={20} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} value={variant.label} />
              </label>
              <label className="products-field">
                <span>Unit</span>
                <select onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, unit: event.target.value } : item))} value={variant.unit}>
                  {suggestedUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </label>
              <label className="products-field">
                <span>Quantity</span>
                <input min="0.01" onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} step="any" type="number" value={variant.quantity} />
              </label>
              <label className="products-field">
                <span>Price (₹)</span>
                <input min="0" onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} step="any" type="number" value={variant.price} />
              </label>
              <label className="products-field">
                <span>Stock</span>
                <input min="0" onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, stock: event.target.value } : item))} step="1" type="number" value={variant.stock} />
              </label>
              {variants.length > 1 && (
                <button className="text-action is-danger" onClick={() => setVariants((current) => current.filter((_, i) => i !== index))} type="button">
                  Remove
                </button>
              )}
            </div>
          ))}
          {errors.variants && <p className="products-field-error" role="alert">{errors.variants}</p>}
        </section>

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
