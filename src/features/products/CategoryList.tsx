import type { Product, ProductCategory } from './types'

interface CategoryListProps {
  categories: ProductCategory[]
  onDelete: (category: ProductCategory) => void
  onEdit: (category: ProductCategory) => void
  products: Product[]
}

export function CategoryList({
  categories,
  onDelete,
  onEdit,
  products,
}: CategoryListProps) {
  return (
    <div className="category-list">
      {categories.map((category) => {
        const count = products.filter(
          (product) => product.categoryId === category.id,
        ).length
        return (
          <article className="category-card" key={category.id}>
            <div className="category-card-icon" aria-hidden="true">
              {category.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="category-card-info">
              <h3>{category.name}</h3>
              <p>{count} {count === 1 ? 'product' : 'products'}</p>
            </div>
            <div className="category-card-actions">
              <button
                aria-label={`Edit ${category.name}`}
                className="text-action"
                onClick={() => onEdit(category)}
                type="button"
              >
                Edit
              </button>
              <button
                aria-label={`Delete ${category.name}`}
                className="text-action is-danger"
                onClick={() => onDelete(category)}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
