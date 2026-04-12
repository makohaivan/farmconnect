/**
 * FarmConnect — Axios Configuration
 *
 * This file sets up the Axios HTTP client with two important behaviours:
 *
 * 1. REQUEST INTERCEPTOR
 *    Automatically attaches the JWT access token to every outgoing request
 *    as a Bearer header. The developer never needs to add it manually.
 *
 * 2. RESPONSE INTERCEPTOR
 *    When the server returns a 401 (Unauthorized — usually means the access
 *    token has expired), this interceptor automatically:
 *      a. Calls the refresh endpoint to get a new access token
 *      b. Updates the stored token
 *      c. Retries the original failed request with the new token
 *
 *    This means the user never notices when their token expires.
 *    They stay logged in seamlessly for up to 7 days.
 */
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL:        '/api/v1',   // Proxied to Django by Vite in development
  withCredentials: true,       // Send cookies (needed for refresh token cookie)
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ───────────────────────────────────────────────────────
// Runs before every request is sent
api.interceptors.request.use(
  (config) => {
    // Get the current access token from Zustand store
    const token = useAuthStore.getState().accessToken

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────────────────────────
// Runs after every response is received

// Track whether we are already trying to refresh
// Prevents infinite loops if the refresh itself fails
let isRefreshing = false

// Queue of requests that came in while we were refreshing
// We replay them all once we have a new token
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  // If the response is successful, just return it
  (response) => response,

  // If the response is an error...
  async (error) => {
    const originalRequest = error.config

    // Only handle 401 errors (Unauthorized)
    // Only retry once (prevent infinite loop with _retry flag)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing            = true

      try {
        // Call the refresh endpoint
        // The HttpOnly cookie is sent automatically (withCredentials: true)
        const response = await axios.post('/api/v1/auth/refresh/', {}, {
          withCredentials: true
        })

        const newToken = response.data.access_token
        const newUser  = response.data.user

        // Update Zustand store with new token and user
        useAuthStore.getState().setAuth(newUser, newToken)

        // Replay all queued requests with the new token
        processQueue(null, newToken)

        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed — session is truly expired
        // Log the user out and redirect to login
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
