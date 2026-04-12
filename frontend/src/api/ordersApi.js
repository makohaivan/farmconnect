import api from './axios'

export const placeOrder = async (orderData) => {
  const res = await api.post('/orders/', orderData)
  return res.data
}

export const getBuyerOrders = async () => {
  const res = await api.get('/orders/buyer/')
  return res.data
}

export const getOrderDetail = async (id) => {
  const res = await api.get(`/orders/${id}/`)
  return res.data
}

export const cancelOrder = async (id) => {
  const res = await api.post(`/orders/${id}/cancel/`)
  return res.data
}
