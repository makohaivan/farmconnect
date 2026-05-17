import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, ShoppingCart, X } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { useCartStore, cartItemCount } from '../../store/cartStore'
import { getProducts, getCategories } from '../../api/productsApi'
import { Button, Spinner, Alert, EmptyState } from '../../components/ui'

function Stars({ rating, count }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false)
  const handleAdd = () => { onAdd(product); setAdded(true); setTimeout(() => setAdded(false), 1500) }

  return (
    <div className="card-hover overflow-hidden flex flex-col group">
      <div className="h-44 bg-gray-100 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-5xl opacity-30">{product.category_icon || '🌾'}</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs
                         font-medium text-gray-700 px-2 py-0.5 rounded-full">
          {product.category_icon} {product.category_name}
        </span>
        {product.quantity <= 5 && product.quantity > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs
                           font-bold px-2 py-0.5 rounded-full">
            Only {product.quantity} left
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-0.5">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-0.5">🌾 {product.farm_name || product.farmer_name}</p>
        {product.location && <p className="text-xs text-gray-400 mb-1.5">📍 {product.location}</p>}
        {product.avg_rating > 0 && (
          <div className="mb-2">
            <Stars rating={product.avg_rating} count={product.review_count} />
          </div>
        )}
        <div className="flex items-end justify-between mt-auto mb-3">
          <div>
            <p className="text-lg font-bold text-primary-600">UGX {Number(product.price).toLocaleString()}</p>
            <p className="text-xs text-gray-400">per {product.unit}</p>
          </div>
          <p className="text-xs text-gray-500">{product.quantity} {product.unit}</p>
        </div>
        <button onClick={handleAdd}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            added ? 'bg-emerald-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
          }`}>
          {added ? '✓ Added' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default function ProductCatalog() {
  const { addItem }    = useCartStore()
  const cartCount      = useCartStore(cartItemCount)

  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [toast,       setToast]       = useState('')
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [ordering,    setOrdering]    = useState('-created_at')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { getCategories().then(setCategories).catch(() => {}) }, [])

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

  const handleAdd = product => {
    addItem(product, 1)
    setToast(`${product.name} added to cart!`)
    setTimeout(() => setToast(''), 2500)
  }

  const clearFilters = () => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setOrdering('-created_at') }
  const hasFilters = search || category || minPrice || maxPrice

  return (
    <AppLayout title="Browse Products" subtitle="Fresh produce from local farmers">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3
                        rounded-2xl shadow-xl text-sm font-medium flex items-center
                        gap-2 animate-fade-up">
          ✓ {toast}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tomatoes, maize, milk…"
            className="input pl-10 text-sm" />
        </div>

        <select value={ordering} onChange={e => setOrdering(e.target.value)}
          className="input text-sm w-44">
          <option value="-created_at">Newest First</option>
          <option value="price">Price: Low → High</option>
          <option value="-price">Price: High → Low</option>
          <option value="name">Name A–Z</option>
        </select>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                      font-semibold border transition-colors ${
            showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {hasFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
        </button>

        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:underline font-medium">
            <X className="w-4 h-4" /> Clear
          </button>
        )}

        <Link to="/buyer/cart"
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-primary-600 text-white text-sm font-semibold
                     hover:bg-primary-700 transition-colors ml-auto">
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cartCount > 0 && (
            <span className="w-5 h-5 bg-white text-primary-600 text-xs rounded-full
                             flex items-center justify-center font-bold">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Price filter */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5
                        flex items-center gap-4 flex-wrap animate-fade-in">
          <p className="text-sm font-semibold text-gray-700">Price Range (UGX):</p>
          <input type="number" placeholder="Min" value={minPrice}
            onChange={e => setMinPrice(e.target.value)} className="input text-sm w-32" />
          <span className="text-gray-400">–</span>
          <input type="number" placeholder="Max" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)} className="input text-sm w-32" />
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
        <button onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
            !category ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          All Products
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setCategory(category == c.id ? '' : c.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              category == c.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {c.icon} {c.name}
            {c.product_count > 0 && <span className="ml-1 opacity-60 text-xs">({c.product_count})</span>}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {products.length} product{products.length !== 1 ? 's' : ''}
          {hasFilters && ' found'}
        </p>
      )}

      {error && <div className="mb-5"><Alert type="error" message={error} /></div>}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" className="text-primary-600" /></div>
      ) : products.length === 0 ? (
        <EmptyState title="No products found"
          description={hasFilters ? 'Try adjusting your filters or search term.' : 'No products available right now.'}
          action={hasFilters && <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} onAdd={handleAdd} />)}
        </div>
      )}
    </AppLayout>
  )
}
