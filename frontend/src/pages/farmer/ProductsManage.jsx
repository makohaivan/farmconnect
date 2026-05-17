import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Sparkles, Package } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { Button, Input, Alert, Spinner, Modal, ConfirmDialog, EmptyState } from '../../components/ui'
import {
  getMyListings, createProduct, updateProduct,
  deleteProduct, toggleAvailability, getCategories
} from '../../api/productsApi'
import { generateDescription, getPriceSuggestion } from '../../api/aiApi'

const UNITS = ['kg','gram','crate','bag','litre','bunch','piece','dozen']

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product
  const fileRef = useRef()

  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    price: product?.price || '', quantity: product?.quantity || '',
    unit: product?.unit || 'kg', category: product?.category || '',
    is_available: product?.is_available ?? true,
  })
  const [image,    setImage]    = useState(null)
  const [preview,  setPreview]  = useState(product?.image_url || null)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})
  const [error,    setError]    = useState('')
  const [genDesc,  setGenDesc]  = useState(false)
  const [genPrice, setGenPrice] = useState(false)
  const [priceSug, setPriceSug] = useState(null)

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    setPriceSug(null)
  }

  const handleImage = e => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleGenerateDescription = async () => {
    if (!form.name.trim()) { setErrors(p => ({ ...p, name: 'Enter name first.' })); return }
    setGenDesc(true)
    try {
      const catName = categories.find(c => c.id == form.category)?.name || ''
      const data = await generateDescription({ name: form.name, category: catName, quantity: form.quantity, unit: form.unit })
      setForm(p => ({ ...p, description: data.description }))
    } catch (err) {
      setError(err.response?.data?.error || 'AI unavailable.')
    } finally { setGenDesc(false) }
  }

  const handlePriceSuggestion = async () => {
    if (!form.name.trim()) { setErrors(p => ({ ...p, name: 'Enter name first.' })); return }
    setGenPrice(true); setPriceSug(null)
    try {
      const catName = categories.find(c => c.id == form.category)?.name || ''
      const data = await getPriceSuggestion({ name: form.name, category: catName, unit: form.unit, quantity: form.quantity })
      setPriceSug(data)
    } catch (err) {
      setError(err.response?.data?.error || 'AI unavailable.')
    } finally { setGenPrice(false) }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name     = 'Required.'
    if (!form.price)       e.price    = 'Required.'
    if (!form.quantity)    e.quantity = 'Required.'
    if (!form.category)    e.category = 'Select a category.'
    if (Number(form.price) <= 0)   e.price    = 'Must be > 0.'
    if (Number(form.quantity) < 0) e.quantity = 'Cannot be negative.'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (image) data.append('image', image)
      const saved = isEdit ? await updateProduct(product.id, data) : await createProduct(data)
      onSaved(saved, isEdit)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setErrors(Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v)?v[0]:v])))
      else setError(err.response?.data?.error || 'Failed to save.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Product' : 'Add New Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} />}

        {/* Image */}
        <div>
          <label className="label">Product Photo</label>
          <div onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer
                        transition-colors ${preview ? '' : 'hover:border-primary-400'}`}>
            {preview ? (
              <img src={preview} alt="" className="w-full h-48 object-cover rounded-xl" />
            ) : (
              <div className="py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center
                                justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Click to upload a photo</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <Input label="Product Name" name="name" value={form.name}
          onChange={handleChange} error={errors.name} required
          placeholder="e.g. Fresh Tomatoes" />

        {/* Price + AI + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="label">Price (UGX) <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="price" type="number" value={form.price}
                onChange={handleChange}
                className={`input pr-20 ${errors.price ? 'input-error' : ''}`}
                placeholder="2000" />
              <button type="button" onClick={handlePriceSuggestion} disabled={genPrice}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center
                           gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700
                           rounded-lg hover:bg-amber-200 font-semibold disabled:opacity-50">
                {genPrice
                  ? <Spinner size="sm" className="text-amber-600" />
                  : <Sparkles className="w-3 h-3" />}
                AI
              </button>
            </div>
            {errors.price && <p className="error-text">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Unit <span className="text-red-500">*</span></label>
            <select name="unit" value={form.unit} onChange={handleChange} className="input">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* AI Price suggestion */}
        {priceSug && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-fade-in">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> AI Price Suggestion
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Minimum', value: priceSug.min_price, style: 'bg-white text-gray-700' },
                { label: 'Recommended', value: priceSug.recommended_price, style: 'bg-emerald-100 text-emerald-800' },
                { label: 'Maximum', value: priceSug.max_price, style: 'bg-white text-gray-700' },
              ].map(opt => (
                <button key={opt.label} type="button"
                  onClick={() => { setForm(p => ({ ...p, price: String(opt.value) })); setPriceSug(null) }}
                  className={`${opt.style} rounded-xl p-2.5 text-center text-xs
                              font-medium hover:opacity-80 transition-opacity border border-amber-200`}>
                  <p className="text-gray-500 mb-0.5">{opt.label}</p>
                  <p className="font-bold">UGX {Number(opt.value).toLocaleString()}</p>
                </button>
              ))}
            </div>
            {priceSug.reasoning && (
              <p className="text-xs text-amber-700 italic">{priceSug.reasoning}</p>
            )}
          </div>
        )}

        <Input label="Quantity Available" name="quantity" type="number"
          value={form.quantity} onChange={handleChange}
          error={errors.quantity} required placeholder="50" />

        <div className="space-y-1.5">
          <label className="label">Category <span className="text-red-500">*</span></label>
          <select name="category" value={form.category} onChange={handleChange}
            className={`input ${errors.category ? 'input-error' : ''}`}>
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          {errors.category && <p className="error-text">{errors.category}</p>}
        </div>

        {/* Description + AI */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Description</label>
            <button type="button" onClick={handleGenerateDescription} disabled={genDesc}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50
                         text-emerald-700 border border-emerald-200 rounded-lg
                         hover:bg-emerald-100 font-medium disabled:opacity-50">
              {genDesc ? <Spinner size="sm" className="text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5" />}
              {genDesc ? 'Writing…' : 'Write with AI'}
            </button>
          </div>
          <textarea name="description" value={form.description}
            onChange={handleChange} className="input h-24 resize-none"
            placeholder="Describe your product…" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_available" checked={form.is_available}
            onChange={handleChange} className="w-4 h-4 accent-primary-600 rounded" />
          <span className="text-sm text-gray-700">Available for purchase</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} fullWidth>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ProductsManage() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')

  const flash = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  useEffect(() => {
    setLoading(true)
    Promise.all([getMyListings(), getCategories()])
      .then(([prods, cats]) => { setProducts(prods.results || []); setCategories(cats) })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (saved, isEdit) => {
    if (isEdit) setProducts(p => p.map(x => x.id === saved.id ? saved : x))
    else        setProducts(p => [saved, ...p])
    flash(isEdit ? 'Product updated.' : 'Product added.')
    setShowModal(false); setEditItem(null)
  }

  const handleToggle = async id => {
    try {
      const res = await toggleAvailability(id)
      setProducts(p => p.map(x => x.id === id ? { ...x, is_available: res.is_available } : x))
    } catch { setError('Failed to update.') }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      await deleteProduct(deleteItem.id)
      setProducts(p => p.filter(x => x.id !== deleteItem.id))
      setDeleteItem(null); flash('Product deleted.')
    } catch { setError('Failed to delete.') }
    finally { setDeleting(false) }
  }

  return (
    <AppLayout title="My Products"
      subtitle={`${products.length} listing${products.length !== 1 ? 's' : ''}`}>
      {error   && <div className="mb-5"><Alert type="error"   message={error}   onClose={() => setError('')}   /></div>}
      {success && <div className="mb-5"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}

      {/* Header action */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <Button icon={Plus} onClick={() => { setEditItem(null); setShowModal(true) }}>
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" className="text-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet"
          description="Add your first listing. AI will help you write a great description and suggest the right price."
          action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add First Product</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="card-hover overflow-hidden flex flex-col group">
              {/* Image */}
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105
                               transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center
                                  bg-gradient-to-br from-gray-50 to-gray-100">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`badge text-xs ${
                    p.is_available ? 'badge-green' : 'badge-red'
                  }`}>
                    {p.is_available ? 'Available' : 'Hidden'}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur-sm text-xs
                                   text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {p.category_icon} {p.category_name}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">
                  {p.name}
                </h3>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-primary-600">
                      UGX {Number(p.price).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">per {p.unit}</p>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {p.quantity} {p.unit}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => { setEditItem(p); setShowModal(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2
                               text-xs font-medium bg-blue-50 text-blue-700
                               rounded-xl hover:bg-blue-100 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleToggle(p.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2
                                text-xs font-medium rounded-xl transition-colors ${
                      p.is_available
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}>
                    {p.is_available
                      ? <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                      : <><Eye className="w-3.5 h-3.5" /> Show</>
                    }
                  </button>
                  <button onClick={() => setDeleteItem(p)}
                    className="w-9 flex items-center justify-center py-2 text-xs
                               bg-red-50 text-red-600 rounded-xl hover:bg-red-100
                               transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductFormModal
          product={editItem} categories={categories}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
        confirmLabel="Delete" variant="danger"
      />
    </AppLayout>
  )
}
