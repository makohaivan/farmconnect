/**
 * FarmConnect — Product Catalog
 * Buyers browse all available products, filter, search, and add to cart.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCartStore } from '../../store/cartStore'
import { getProducts, getCategories } from '../../api/productsApi'
import { Button, Logo, Spinner, Alert } from '../../components/ui'

// ── Cart Badge in header ──────────────────────────────────────────────────────
function CartBadge() {
  const totalItems = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  return (
    <Link to="/buyer/cart"
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-primary-50 hover:bg-primary-100 transition-colors">
      <span className="text-xl">🛒</span>
      <span className="text-sm font-medium text-primary-700">Cart</span>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white
                         text-xs rounded-full flex items-center justify-center font-bold">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  )
}

// ── Single Product Card ───────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="h-44 bg-gray-100 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">
            {product.category_icon || '🌾'}
          </div>
        )}
        {/* Category pill */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm
                         text-xs font-medium text-gray-700 px-2 py-0.5 rounded-full">
          {product.category_icon} {product.category_name}
        </span>
        {product.quantity <= 5 && product.quantity > 0 && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white
                           text-xs font-bold px-2 py-0.5 rounded-full">
            Only {product.quantity} left!
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-farm-dark text-sm leading-tight mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-1">
          🌾 {product.farm_name || product.farmer_name}
        </p>
        {product.location && (
          <p className="text-xs text-gray-400 mb-2">📍 {product.location}</p>
        )}

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xl font-bold text-primary-600">
                UGX {Number(product.price).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">per {product.unit}</p>
            </div>
            <p className="text-xs text-gray-500">
              {product.quantity} {product.unit} available
            </p>
          </div>

          <button
            onClick={handleAdd}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
            }`}
          >
            {added ? '✓ Added to Cart' : '+ Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Catalog Page ─────────────────────────────────────────────────────────
export default function ProductCatalog() {
  const { user, logout } = useAuth()
  const { addItem }      = useCartStore()

  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [toast,      setToast]      = useState('')

  // Filters
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [ordering,    setOrdering]    = useState('-created_at')
  const [showFilters, setShowFilters] = useState(false)

  // Load categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  // Load products whenever filters change
  useEffect(() => {
    setLoading(true)
    const params = { ordering }
    if (search)   params.search    = search
    if (category) params.category  = category
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice

    getProducts(params)
      .then(data => setProducts(data.results || []))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false))
  }, [search, category, minPrice, maxPrice, ordering])

  const handleAddToCart = (product) => {
    addItem(product, 1)
    setToast(`${product.name} added to cart!`)
    setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setOrdering('-created_at')
  }

  const hasFilters = search || category || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white
                        px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                        flex items-center gap-2 fade-in">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Logo />

          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for tomatoes, maize, milk..."
              className="input text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/buyer/dashboard"
              className="text-sm text-gray-500 hover:text-primary-600 hidden sm:block">
              Dashboard
            </Link>
            <CartBadge />
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center
                            justify-center text-blue-700 font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !category
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(category == c.id ? '' : c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category == c.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c.icon} {c.name}
              {c.product_count > 0 && (
                <span className="ml-1 text-xs opacity-70">({c.product_count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${products.length} products`}
              {hasFilters && ' (filtered)'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={ordering}
              onChange={e => setOrdering(e.target.value)}
              className="input text-sm w-44"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>

            {/* Price filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary text-sm ${showFilters ? 'border-primary-400' : ''}`}
            >
              🔧 Price Filter
            </button>
          </div>
        </div>

        {/* Price range filter (expandable) */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5
                          flex items-center gap-4 flex-wrap fade-in">
            <p className="text-sm font-medium text-gray-700">Price Range (UGX):</p>
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="input text-sm w-36"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="input text-sm w-36"
            />
            <button
              onClick={() => { setMinPrice(''); setMaxPrice('') }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="green" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🌾</p>
            <h2 className="text-lg font-semibold text-farm-dark">No products found</h2>
            <p className="text-gray-500 text-sm mt-2">
              {hasFilters
                ? 'Try adjusting your filters or search term.'
                : 'No products are available right now. Check back soon!'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="mt-4 text-primary-600 text-sm hover:underline font-medium">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
                          lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
