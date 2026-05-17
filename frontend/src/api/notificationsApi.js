import api from './axios'

export const getNotifications  = async ()   => (await api.get('/notifications/')).data
export const markRead          = async (id) => api.post(`/notifications/${id}/read/`)
export const markAllRead       = async ()   => api.post('/notifications/read-all/')
export const clearNotifications= async ()   => api.delete('/notifications/clear/')
