import api from './axios'

// ── Categories ─────────────────────────────────────────────────────────────
export const getCategories = async () => {
  const res = await api.get('/products/categories/')
  return res.data
}

// ── Public catalog ─────────────────────────────────────────────────────────
export const getProducts = async (params = {}) => {
  const res = await api.get('/products/', { params })
  return res.data
}

export const getProduct = async (id) => {
  const res = await api.get(`/products/${id}/`)
  return res.data
}

// ── Farmer CRUD ────────────────────────────────────────────────────────────
export const getMyListings = async (params = {}) => {
  const res = await api.get('/products/my-listings/', { params })
  return res.data
}

export const createProduct = async (formData) => {
  const res = await api.post('/products/my-listings/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const updateProduct = async (id, formData) => {
  const res = await api.patch(`/products/my-listings/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const deleteProduct = async (id) => {
  await api.delete(`/products/my-listings/${id}/`)
}

export const toggleAvailability = async (id) => {
  const res = await api.post(`/products/my-listings/${id}/toggle/`)
  return res.data
}
