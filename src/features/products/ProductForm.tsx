import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { PartnerTypeConfig } from '../../config/partnerTypes'
import { partnerData } from '../../services/api/partnerData'
import { Dialog } from './Dialog'
import type { Product, ProductCategory, ProductDraft, ProductVariant } from './types'

type VariantInput = { label: string; unit: string; quantity: string; price: string; stock: string }

interface ProductFormProps {
  allowedUnits: string[]
  extraFields: PartnerTypeConfig['extraProductFields']
  categories: ProductCategory[]
  shops?: Array<{ id: string; name: string }>
  product?: Product
  imageUploadEnabled?: boolean
  allowUncategorized?: boolean
  showThresholdControl?: boolean
  onCancel: () => void
  onSave: (product: ProductDraft) => Promise<void>
}

export function ProductForm({
  allowedUnits,
  extraFields,
  categories,
  shops = [],
  product,
  imageUploadEnabled = true,
  allowUncategorized = false,
  showThresholdControl = true,
  onCancel,
  onSave,
}: ProductFormProps) {
  const suggestedUnits = allowedUnits
  const initialUnit = product?.unit ?? ''
  const [shopId, setShopId] = useState(product?.shopId ?? (shops.length === 1 ? shops[0].id : ''))
  const shopCategories = categories.filter(
    (category) => !category.shopId || !shopId || category.shopId === shopId,
  )
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
    product?.stockQuantity === null ? '' : String(product?.stockQuantity ?? 0),
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
          stock: variant.stock === null ? '' : String(variant.stock),
        }))
      : [{ label: 'Regular', unit: suggestedUnits[0] ?? '', quantity: '1', price: '0', stock: '0' }],
  )
  const variantStockValues = variants.map((variant) =>
    variant.stock.trim() === '' ? null : Number(variant.stock),
  )
  const parsedStockQuantity = showThresholdControl
    ? (stockQuantity.trim() === '' ? null : Number(stockQuantity))
    : variantStockValues.every((value) => value !== null)
      ? variantStockValues.reduce<number>((total, value) => total + (value ?? 0), 0)
      : null
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [imageError, setImageError] = useState('')
  const [formError, setFormError] = useState('')
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const title = product ? 'Edit product' : 'Add product'

  async function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageError('')
    setFormError('')
    setIsProcessingImage(true)
    try {
      setImageUrl(await partnerData.uploadProductImage(file))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessingImage(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isProcessingImage || isSaving) return
    const parsedPrice = Number(price)
    const parsedDemoStockQuantity = stockQuantity.trim() === '' ? null : Number(stockQuantity)
    const parsedRestockThreshold = Number(restockThreshold)
    const savedUnit = unitChoice.trim()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = 'Enter a product name.'
    if (name.trim().length > 80) nextErrors.name = 'Product name must be 80 characters or fewer.'
    if (shops.length > 1 && !shopId) nextErrors.shopId = 'Choose a shop.'
    if (!categoryId && shopCategories.length > 0 && !allowUncategorized) {
      nextErrors.categoryId = 'Choose a category.'
    }
    if (price.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      nextErrors.price = 'Enter a valid non-negative price.'
    }
    if (
      showThresholdControl &&
      stockQuantity.trim() !== '' &&
      (!Number.isInteger(parsedDemoStockQuantity) || (parsedDemoStockQuantity ?? -1) < 0)
    ) {
      nextErrors.stockQuantity = 'Enter a whole number of 0 or more, or leave it blank for untracked stock.'
    }
    if (showThresholdControl && (
      restockThreshold.trim() === '' ||
      !Number.isInteger(parsedRestockThreshold) ||
      parsedRestockThreshold < 1
    )) {
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
      (variant.stock.trim() !== '' &&
        (!Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0)) ||
      Math.round(Number(variant.price) * 100) / 100 !== Number(variant.price),
    )) {
      nextErrors.variants = 'Enter a valid unit, quantity, price, and stock for each variant.'
    } else if (
    variantStockValues.every((value) => value !== null) &&
    variantStockValues.reduce<number>((total, value) => total + (value ?? 0), 0) > 2147483647
    ) {
    nextErrors.variants = 'Combined variant stock exceeds the supported inventory quantity.'
    }
    for (const field of extraFields) {
      const value = extraValues[field.key]
      if (field.required && (value === undefined || value === '')) {
        nextErrors[`extra-${field.key}`] = `Enter ${field.label.toLowerCase()}.`
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setFormError('')
    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        ...(shopId ? { shopId } : {}),
        categoryId,
        price: parsedPrice,
        ...(savedUnit ? { unit: savedUnit } : {}),
        description: description.trim(),
        available: available && parsedStockQuantity !== 0,
        stockQuantity: parsedStockQuantity,
        ...(showThresholdControl ? { restockThreshold: parsedRestockThreshold } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        extraFields: extraValues,
        variants: variants.map((variant): ProductVariant => ({
          label: variant.label.trim(),
          unit: variant.unit,
          quantity: Number(variant.quantity),
          price: Number(variant.price),
          stock: variant.stock.trim() === '' ? null : Number(variant.stock),
        })),
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSaving(false)
    }
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
          {shops.length > 1 && (
            <label className="products-field">
              <span>Shop <span className="required-mark">*</span></span>
              <select
                aria-describedby={errors.shopId ? 'product-shop-error' : undefined}
                aria-invalid={Boolean(errors.shopId)}
                disabled={Boolean(product)}
                onChange={(event) => {
                  setShopId(event.target.value)
                  if (categoryId && !categories.some((category) =>
                    category.id === categoryId &&
                    (!category.shopId || category.shopId === event.target.value),
                  )) {
                    setCategoryId('')
                  }
                }}
                value={shopId}
              >
                <option value="">Select shop</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
              {errors.shopId && (
                <span className="products-field-error" id="product-shop-error">
                  {errors.shopId}
                </span>
              )}
              {product && <small>A product cannot be moved to another shop.</small>}
            </label>
          )}
          <label className="products-field">
            <span>
              Category
              {shopCategories.length > 0 && !allowUncategorized && <span className="required-mark"> *</span>}
              {allowUncategorized && ' (optional)'}
            </span>
            <select
              aria-describedby={errors.categoryId ? 'product-category-error' : undefined}
              aria-invalid={Boolean(errors.categoryId)}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={shopCategories.length === 0}
              value={categoryId}
            >
              <option value="">
                {shopCategories.length && !allowUncategorized
                  ? 'Select category'
                  : 'No category assigned'}
              </option>
              {shopCategories.map((category) => (
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
            <span>Starting price (₹) <span className="required-mark">*</span></span>
            <input
              aria-describedby={errors.price ? 'product-price-error' : undefined}
              aria-invalid={Boolean(errors.price)}
              inputMode="decimal"
              min="0"
              onChange={(event) => {
                setPrice(event.target.value)
                setVariants((current) => current.map((variant, index) =>
                  index === 0 ? { ...variant, price: event.target.value } : variant,
                ))
              }}
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
                <input min="0" onChange={(event) => {
                  const nextPrice = event.target.value
                  setVariants((current) => current.map((item, i) =>
                    i === index ? { ...item, price: nextPrice } : item,
                  ))
                  if (index === 0) setPrice(nextPrice)
                }} step="any" type="number" value={variant.price} />
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
          {showThresholdControl ? (
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
          ) : (
            <p className="products-field" role="status">
              <span>Inventory total</span>
              <strong>
                {parsedStockQuantity === null
                  ? 'Not tracked'
                  : parsedStockQuantity.toLocaleString('en-IN')}
              </strong>
              <small>Calculated from the variant stock values below.</small>
            </p>
          )}
          {showThresholdControl && <label className="products-field">
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
          </label>}
        </div>

        <div className="products-field">
          <span>Product image</span>
          <div className="product-image-picker">
            <div className="product-image-preview">
              {imageUrl ? (
                <img alt="Product preview" src={imageUrl} />
              ) : (
                <span aria-hidden="true" className="product-image-empty-icon">▧</span>
              )}
            </div>
            <div className="product-image-actions">
              {imageUploadEnabled && <input
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={imageError ? 'product-image-error' : undefined}
                aria-label="Choose product image"
                className="sr-only"
                onChange={(event) => void handleImageSelection(event)}
                ref={imageInputRef}
                type="file"
              />}
              {imageUploadEnabled && <button
                className="products-button products-button-secondary"
                disabled={isProcessingImage}
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                {imageUrl ? 'Replace' : 'Choose image'}
              </button>}
              {imageUploadEnabled && imageUrl && (
                <button
                  className="products-button products-button-secondary"
                  disabled={isProcessingImage}
                  onClick={() => {
                    setImageUrl('')
                    setImageError('')
                  }}
                  type="button"
                >
                  Remove
                </button>
              )}
              {isProcessingImage && <small aria-live="polite">Processing image…</small>}
              {!imageUploadEnabled && (
                <small>Image upload is unavailable because no partner image API is configured.</small>
              )}
            </div>
          </div>
          {imageError && (
            <span className="products-field-error" id="product-image-error" role="alert">
              {imageError}
            </span>
          )}
          {formError && <span className="products-field-error" role="alert">{formError}</span>}
          {imageUploadEnabled && <small className="product-image-help">JPEG, PNG, or WebP. Maximum 5 MB.</small>}
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
          <button
            className="products-button products-button-primary"
            disabled={isProcessingImage || isSaving}
            type="submit"
          >
            {isSaving ? 'Saving…' : isProcessingImage ? 'Processing image…' : 'Save Product'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
