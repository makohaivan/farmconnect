import api from './axios'

export const getAdminStats    = async ()         => (await api.get('/auth/admin/stats/')).data
export const getAdminUsers    = async (params={})=> (await api.get('/auth/admin/users/', { params })).data
export const getAdminUser     = async (id)       => (await api.get(`/auth/admin/users/${id}/`)).data
export const updateAdminUser  = async (id, data) => (await api.patch(`/auth/admin/users/${id}/update/`, data)).data
export const deleteAdminUser  = async (id)       => api.delete(`/auth/admin/users/${id}/delete/`)
export const toggleAdminUser  = async (id)       => (await api.post(`/auth/admin/users/${id}/toggle/`)).data
