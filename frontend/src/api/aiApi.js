import api from './axios'

export const generateDescription = async (data) => {
  const res = await api.post('/ai/generate-description/', data)
  return res.data
}

export const getPriceSuggestion = async (data) => {
  const res = await api.post('/ai/price-suggest/', data)
  return res.data
}

export const sendChatMessage = async (message, history) => {
  const res = await api.post('/ai/chat/', { message, history })
  return res.data
}

export const getFarmerInsights = async () => {
  const res = await api.get('/ai/insights/')
  return res.data
}
