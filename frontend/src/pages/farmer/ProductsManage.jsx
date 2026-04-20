/**
 * FarmConnect — Products Management (with AI features)
 * Farmers can generate descriptions and get price suggestions using AI.
 */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getMyListings, createProduct, updateProduct,
  deleteProduct, toggleAvailability, getCategories
} from '../../api/productsApi'
import { generateDescription, getPriceSuggestion } from '../../api/aiApi'
import { Button, Input, Alert, Logo, Spinner } from '../../components/ui'

const UNITS = ['kg','gram','crate','bag','litre','bunch','piece','dozen']

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductFormModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product
  const fileRef = useRef()

  const [form, setForm] = useState({
    name:         product?.name        || '',
    description:  product?.description || '',
    price:        product?.price       || '',
    quantity:     product?.quantity    || '',
    unit:         product?.unit        || 'kg',
    category:     product?.category    || '',
    is_available: product?.is_available ?? true,
  })
  const [image,       setImage]       = useState(null)
  const [preview,     setPreview]     = useState(product?.image_url || null)
  const [loading,     setLoading]     = useState(false)
  const [errors,      setErrors]      = useState({})
  const [error,       setError]       = useState('')

  // AI states
  const [genDesc,     setGenDesc]     = useState(false)  // generating description
  const [genPrice,    setGenPrice]    = useState(false)  // generating price
  const [priceSug,    setPriceSug]    = useState(null)   // price suggestion result

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setPriceSug(null) // clear price suggestion when fields change
  }

  const handleImage = e => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  // ── AI: Generate Description ────────────────────────────────────────────────
  const handleGenerateDescription = async () => {
    if (!form.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Enter product name first.' }))
      return
    }
    setGenDesc(true)
    try {
      const categoryName = categories.find(c => c.id == form.category)?.name || ''
      const data = await generateDescription({
        name:     form.name,
        category: categoryName,
        quantity: form.quantity,
        unit:     form.unit,
      })
      setForm(prev => ({ ...prev, description: data.description }))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate description.')
    } finally {
      setGenDesc(false)
    }
  }

  // ── AI: Get Price Suggestion ────────────────────────────────────────────────
  const handlePriceSuggestion = async () => {
    if (!form.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Enter product name first.' }))
      return
    }
    setGenPrice(true)
    setPriceSug(null)
    try {
      const categoryName = categories.find(c => c.id == form.category)?.name || ''
      const data = await getPriceSuggestion({
        name:     form.name,
        category: categoryName,
        unit:     form.unit,
        quantity: form.quantity,
      })
      setPriceSug(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get price suggestion.')
    } finally {
      setGenPrice(false)
    }
  }

  const applyPrice = (price) => {
    setForm(prev => ({ ...prev, price: String(price) }))
    setPriceSug(null)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name     = 'Product name is required.'
    if (!form.price)        e.price    = 'Price is required.'
    if (!form.quantity)     e.quantity = 'Quantity is required.'
    if (!form.category)     e.category = 'Please select a category.'
    if (Number(form.price) <= 0)   e.price    = 'Price must be greater than 0.'
    if (Number(form.quantity) < 0) e.quantity = 'Quantity cannot be negative.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (image) data.append('image', image)

      const saved = isEdit
        ? await updateProduct(product.id, data)
        : await createProduct(data)

      onSaved(saved, isEdit)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setErrors(
        Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v)?v[0]:v]))
      )
      else setError(err.response?.data?.error || 'Failed to save product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh]
                      overflow-y-auto shadow-2xl fade-in">

        {/* Modal header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b
                        border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-farm-dark">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert type="error" message={error} />}

          {/* Image upload */}
          <div>
            <label className="label">Product Photo</label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4
                         text-center cursor-pointer hover:border-primary-400
                         transition-colors"
            >
              {preview ? (
                <img src={preview} alt="preview"
                  className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div className="py-6">
                  <p className="text-4xl mb-2">📸</p>
                  <p className="text-sm text-gray-500">Click to upload a photo</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*"
              className="hidden" onChange={handleImage} />
          </div>

          {/* Name */}
          <Input label="Product Name" name="name" value={form.name}
            onChange={handleChange} error={errors.name} required
            placeholder="e.g. Fresh Tomatoes" />

          {/* Price + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label">
                Price (UGX) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="price" type="number" value={form.price}
                  onChange={handleChange}
                  className={`input pr-24 ${errors.price ? 'input-error' : ''}`}
                  placeholder="e.g. 2000"
                />
                <button
                  type="button"
                  onClick={handlePriceSuggestion}
                  disabled={genPrice}
                  className="absolute right-1 top-1 bottom-1 px-2 text-xs
                             bg-purple-100 text-purple-700 rounded-lg
                             hover:bg-purple-200 font-medium transition-colors
                             disabled:opacity-50 flex items-center gap-1"
                >
                  {genPrice ? (
                    <div className="w-3 h-3 border border-purple-600
                                    border-t-transparent rounded-full animate-spin" />
                  ) : '✨'}
                  AI
                </button>
              </div>
              {errors.price && <p className="error-text">{errors.price}</p>}
            </div>

            <div className="space-y-1">
              <label className="label">Unit <span className="text-red-500">*</span></label>
              <select name="unit" value={form.unit}
                onChange={handleChange} className="input">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* AI Price Suggestion Result */}
          {priceSug && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 fade-in">
              <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                ✨ AI Price Suggestion
              </p>
              <div className="flex gap-2 mb-2">
                {[
                  { label: 'Min',         value: priceSug.min_price,         color: 'bg-gray-100 text-gray-700' },
                  { label: 'Recommended', value: priceSug.recommended_price, color: 'bg-green-100 text-green-700' },
                  { label: 'Max',         value: priceSug.max_price,         color: 'bg-blue-100 text-blue-700' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => applyPrice(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium
                               ${opt.color} hover:opacity-80 transition-opacity`}
                  >
                    {opt.label}
                    <br />
                    <span className="font-bold">
                      UGX {Number(opt.value).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
              {priceSug.reasoning && (
                <p className="text-xs text-purple-600 italic">{priceSug.reasoning}</p>
              )}
            </div>
          )}

          {/* Quantity */}
          <Input label="Quantity Available" name="quantity" type="number"
            value={form.quantity} onChange={handleChange}
            error={errors.quantity} required placeholder="e.g. 50" />

          {/* Category */}
          <div className="space-y-1">
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select name="category" value={form.category} onChange={handleChange}
              className={`input ${errors.category ? 'input-error' : ''}`}>
              <option value="">Select a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.category && <p className="error-text">{errors.category}</p>}
          </div>

          {/* Description with AI button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={genDesc}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5
                           bg-green-50 text-green-700 border border-green-200
                           rounded-lg hover:bg-green-100 font-medium
                           transition-colors disabled:opacity-50"
              >
                {genDesc ? (
                  <div className="w-3 h-3 border border-green-600
                                  border-t-transparent rounded-full animate-spin" />
                ) : '✨'}
                {genDesc ? 'Writing...' : 'Write with AI'}
              </button>
            </div>
            <textarea
              name="description" value={form.description}
              onChange={handleChange}
              className="input h-24 resize-none"
              placeholder="Describe your product — freshness, origin, how it's grown..."
            />
            {form.description && (
              <p className="text-xs text-gray-400">
                {form.description.length} characters
              </p>
            )}
          </div>

          {/* Availability toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="is_available" checked={form.is_available}
              onChange={handleChange} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm text-gray-700">
              Mark as available for purchase
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} fullWidth>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsManage() {
  const { user, logout } = useAuth()

  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [success,     setSuccess]     = useState('')
  const [error,       setError]       = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([getMyListings(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods.results || [])
        setCategories(cats)
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const flash = msg => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
      flash('Product updated successfully.')
    } else {
      setProducts(prev => [saved, ...prev])
      flash('Product added successfully.')
    }
    setShowModal(false)
    setEditProduct(null)
  }

  const handleToggle = async (id) => {
    try {
      const res = await toggleAvailability(id)
      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, is_available: res.is_available } : p)
      )
      flash(res.message)
    } catch { setError('Failed to update availability.') }
  }

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setConfirmDel(null)
      flash('Product deleted.')
    } catch { setError('Failed to delete product.') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/farmer/dashboard"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center
                          justify-center text-primary-700 font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-farm-dark">My Products</h1>
            <p className="text-gray-500 text-sm mt-1">
              {products.length} listing{products.length !== 1 ? 's' : ''}
              <span className="ml-2 text-xs bg-purple-100 text-purple-700
                               px-2 py-0.5 rounded-full font-medium">
                ✨ AI-powered
              </span>
            </p>
          </div>
          <Button onClick={() => { setEditProduct(null); setShowModal(true) }} size="lg">
            + Add Product
          </Button>
        </div>

        {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="green" />
          </div>
        ) : products.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-6xl mb-4">📦</p>
            <h2 className="text-lg font-semibold text-farm-dark">No products yet</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Add your first listing. Our AI will help you write
              a great description and suggest the right price!
            </p>
            <Button onClick={() => setShowModal(true)}>
              + Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(product => (
              <div key={product.id}
                className="card overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="h-44 bg-gray-100 relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center
                                    justify-center text-5xl text-gray-300">
                      🌾
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 badge ${
                    product.is_available ? 'badge-green' : 'badge-red'
                  }`}>
                    {product.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-farm-dark text-sm
                                   leading-tight">
                      {product.name}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {product.category_icon}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {product.category_name}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold text-primary-600">
                      UGX {Number(product.price).toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal">
                        /{product.unit}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.quantity} {product.unit} left
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditProduct(product); setShowModal(true) }}
                      className="flex-1 text-xs py-2 px-3 rounded-lg bg-blue-50
                                 text-blue-600 hover:bg-blue-100 font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggle(product.id)}
                      className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium ${
                        product.is_available
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {product.is_available ? '⏸ Hide' : '▶ Show'}
                    </button>
                    <button
                      onClick={() => setConfirmDel(product)}
                      className="text-xs py-2 px-3 rounded-lg bg-red-50
                                 text-red-600 hover:bg-red-100 font-medium"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Form Modal */}
      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditProduct(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full
                          shadow-2xl fade-in">
            <div className="text-center mb-5">
              <p className="text-5xl mb-3">🗑️</p>
              <h3 className="font-bold text-lg text-farm-dark">Delete Product?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Are you sure you want to delete{' '}
                <strong>{confirmDel.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth
                onClick={() => setConfirmDel(null)}>
                Cancel
              </Button>
              <Button variant="danger" fullWidth
                onClick={() => handleDelete(confirmDel.id)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
