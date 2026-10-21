import { useState } from 'react'
import type { PartnerTypeConfig } from '../../config/partnerTypes'
import { CategoryForm } from './CategoryForm'
import { CategoryList } from './CategoryList'
import { Dialog } from './Dialog'
import { ProductForm } from './ProductForm'
import { ProductList } from './ProductList'
import type {
  CategoryDraft,
  Product,
  ProductCategory,
  ProductDraft,
} from './types'
import './products.css'

type WorkspaceTab = 'products' | 'categories'
type ProductFilter = 'all' | 'available' | 'out-of-stock'

interface ProductsWorkspaceProps {
  partnerTypeLabel: string
  productsLabel: string
  categorySuggestions: string[]
  allowedUnits: string[]
  extraProductFields: PartnerTypeConfig['extraProductFields']
  demoMode?: boolean
  categories: ProductCategory[]
  products: Product[]
  onCategoriesChange: (update: (current: ProductCategory[]) => ProductCategory[]) => void
  onProductsChange: (update: (current: Product[]) => Product[]) => void
  onSaveProduct: (draft: ProductDraft, productId?: string) => Promise<void>
}

function isProductFilter(value: string): value is ProductFilter {
  return value === 'all' || value === 'available' || value === 'out-of-stock'
}

export default function ProductsWorkspace({
  partnerTypeLabel,
  productsLabel,
  categorySuggestions,
  allowedUnits,
  extraProductFields,
  demoMode = false,
  categories,
  products,
  onCategoriesChange,
  onProductsChange,
  onSaveProduct,
}: ProductsWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('products')
  const [filter, setFilter] = useState<ProductFilter>('all')
  const [productToEdit, setProductToEdit] = useState<Product>()
  const [categoryToEdit, setCategoryToEdit] = useState<ProductCategory>()
  const [productToDelete, setProductToDelete] = useState<Product>()
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory>()
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const filteredProducts = products.filter((product) => {
    if (filter === 'available') return product.available
    if (filter === 'out-of-stock') return !product.available
    return true
  })
  const suggestedCategories = categorySuggestions.filter(
    (suggestion) =>
      !categories.some(
        (category) =>
          category.name.trim().toLowerCase() === suggestion.toLowerCase(),
      ),
  )

  async function saveProduct(draft: ProductDraft) {
    await onSaveProduct(draft, productToEdit?.id)
    closeProductForm()
  }

  function closeProductForm() {
    setShowProductForm(false)
    setProductToEdit(undefined)
  }

  function openNewProductForm() {
    setProductToEdit(undefined)
    setShowProductForm(true)
  }

  function editProduct(product: Product) {
    setProductToEdit(product)
    setShowProductForm(true)
  }

  function saveCategory(draft: CategoryDraft) {
    if (categoryToEdit) {
      onCategoriesChange((current) =>
        current.map((category) =>
          category.id === categoryToEdit.id
            ? { ...category, name: draft.name }
            : category,
        ),
      )
    } else {
      const id = `category-${Date.now()}`
      onCategoriesChange((current) => [...current, { id, name: draft.name }])
    }
    closeCategoryForm()
  }

  function addSuggestedCategory(name: string) {
    onCategoriesChange((current) => {
      const alreadyExists = current.some(
        (category) =>
          category.name.trim().toLowerCase() === name.toLowerCase(),
      )
      if (alreadyExists) return current
      return [...current, { id: `category-${Date.now()}`, name }]
    })
  }

  function closeCategoryForm() {
    setShowCategoryForm(false)
    setCategoryToEdit(undefined)
  }

  function openNewCategoryForm() {
    setCategoryToEdit(undefined)
    setShowCategoryForm(true)
  }

  function deleteProduct() {
    if (!productToDelete) return
    onProductsChange((current) =>
      current.filter((product) => product.id !== productToDelete.id),
    )
    setProductToDelete(undefined)
  }

  function attemptDeleteCategory(category: ProductCategory) {
    setCategoryToDelete(category)
  }

  function deleteCategory() {
    if (!categoryToDelete) return
    if (products.some((product) => product.categoryId === categoryToDelete.id)) {
      return
    }
    onCategoriesChange((current) =>
      current.filter((category) => category.id !== categoryToDelete.id),
    )
    setCategoryToDelete(undefined)
  }

  const categoryHasProducts = categoryToDelete
    ? products.some((product) => product.categoryId === categoryToDelete.id)
    : false
  const categoryProductCount = categoryToDelete
    ? products.filter((product) => product.categoryId === categoryToDelete.id).length
    : 0

  return (
    <div className="products-workspace">
      <div className="products-page-heading">
        <div>
          <p className="page-eyebrow">Catalog</p>
          <h1>{productsLabel}</h1>
          <p className="page-description">
            Manage products and categories for {partnerTypeLabel}. Suggestions and
            product options follow this business type.
          </p>
        </div>
        {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO DATA</span>}
      </div>

      <div className="products-workspace-toolbar">
        <div aria-label="Products workspace" className="products-tabs" role="tablist">
          <button
            aria-selected={tab === 'products'}
            className={`products-tab${tab === 'products' ? ' is-active' : ''}`}
            onClick={() => setTab('products')}
            role="tab"
            type="button"
          >
            {productsLabel} <span>{products.length}</span>
          </button>
          <button
            aria-selected={tab === 'categories'}
            className={`products-tab${tab === 'categories' ? ' is-active' : ''}`}
            onClick={() => setTab('categories')}
            role="tab"
            type="button"
          >
            Categories <span>{categories.length}</span>
          </button>
        </div>
        {tab === 'products' ? (
          <button
            className="products-button products-button-primary"
            onClick={openNewProductForm}
            type="button"
          >
            <span aria-hidden="true">＋</span> Add Product
          </button>
        ) : (
          <button
            className="products-button products-button-primary"
            onClick={openNewCategoryForm}
            type="button"
          >
            <span aria-hidden="true">＋</span> Add Category
          </button>
        )}
      </div>

      {tab === 'products' ? (
        <section aria-label="Product list" className="products-section">
          <div className="products-list-header">
            <div>
              <h2>All {productsLabel.toLowerCase()}</h2>
              <p>Manage the items available to your customers.</p>
            </div>
            <label className="product-filter">
              <span className="sr-only">Filter products by availability</span>
              <select
                onChange={(event) => {
                  if (isProductFilter(event.target.value)) {
                    setFilter(event.target.value)
                  }
                }}
                value={filter}
              >
                <option value="all">All products</option>
                <option value="available">Available</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </label>
          </div>
          <ProductList
            categories={categories}
            onAvailabilityChange={(productId, available) =>
              onProductsChange((current) =>
                current.map((product) =>
                  product.id === productId ? { ...product, available } : product,
                ),
              )
            }
            onDelete={setProductToDelete}
            onEdit={editProduct}
            isEmptyCatalog={products.length === 0}
            products={filteredProducts}
          />
        </section>
      ) : (
        <section aria-label="Category list" className="products-section">
          <div className="products-list-header">
            <div>
              <h2>All categories</h2>
              <p>Organize products with simple, reusable categories.</p>
            </div>
            <span className="category-count">{categories.length} categories</span>
          </div>
          {suggestedCategories.length > 0 && (
            <section
              aria-labelledby="category-suggestions-title"
              className="category-suggestions"
            >
              <div className="category-suggestions-heading">
                <h3 id="category-suggestions-title">
                  Suggested for {partnerTypeLabel}
                </h3>
                <p>Add a suggestion to your categories.</p>
              </div>
              <div className="category-suggestion-list">
                {suggestedCategories.map((suggestion) => (
                  <button
                    aria-label={`Add ${suggestion} category`}
                    className="products-button products-button-secondary"
                    key={suggestion}
                    onClick={() => addSuggestedCategory(suggestion)}
                    type="button"
                  >
                    <span aria-hidden="true">＋</span> {suggestion}
                  </button>
                ))}
              </div>
            </section>
          )}
          <CategoryList
            categories={categories}
            onDelete={attemptDeleteCategory}
            onEdit={(category) => {
              setCategoryToEdit(category)
              setShowCategoryForm(true)
            }}
            products={products}
          />
        </section>
      )}

      {showProductForm && (
        <ProductForm
          allowedUnits={allowedUnits}
          extraFields={extraProductFields}
          categories={categories}
          onCancel={closeProductForm}
          onSave={saveProduct}
          product={productToEdit}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          category={categoryToEdit}
          onCancel={closeCategoryForm}
          onSave={(name) => saveCategory({ name })}
        />
      )}

      {productToDelete && (
        <Dialog
          labelledBy="delete-product-title"
          onClose={() => setProductToDelete(undefined)}
        >
          <div className="products-dialog-header">
            <div>
              <p className="products-dialog-eyebrow">Remove product</p>
              <h2 id="delete-product-title">Delete {productToDelete.name}?</h2>
            </div>
            <button
              aria-label="Close confirmation"
              className="products-close-button"
              onClick={() => setProductToDelete(undefined)}
              type="button"
            >
              ×
            </button>
          </div>
          <p className="dialog-description">
            This demo product will be removed from the list. This action cannot be undone.
          </p>
          <div className="products-form-actions">
            <button
              className="products-button products-button-secondary"
              onClick={() => setProductToDelete(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="products-button products-button-danger"
              onClick={deleteProduct}
              type="button"
            >
              Delete Product
            </button>
          </div>
        </Dialog>
      )}

      {categoryToDelete && (
        <Dialog
          labelledBy="delete-category-title"
          onClose={() => setCategoryToDelete(undefined)}
        >
          <div className="products-dialog-header">
            <div>
              <p className="products-dialog-eyebrow">Remove category</p>
              <h2 id="delete-category-title">Delete {categoryToDelete.name}?</h2>
            </div>
            <button
              aria-label="Close category warning"
              className="products-close-button"
              onClick={() => setCategoryToDelete(undefined)}
              type="button"
            >
              ×
            </button>
          </div>
          <p className={`dialog-description${categoryHasProducts ? ' warning-copy' : ''}`}>
            {categoryHasProducts
              ? `This category contains ${categoryProductCount} ${categoryProductCount === 1 ? 'product' : 'products'}. Reassign or delete those products before removing the category.`
              : 'This category will be removed from your local demo data.'}
          </p>
          <div className="products-form-actions">
            <button
              className="products-button products-button-secondary"
              onClick={() => setCategoryToDelete(undefined)}
              type="button"
            >
              {categoryHasProducts ? 'Got it' : 'Cancel'}
            </button>
            {!categoryHasProducts && (
              <button
                className="products-button products-button-danger"
                onClick={deleteCategory}
                type="button"
              >
                Delete Category
              </button>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}
