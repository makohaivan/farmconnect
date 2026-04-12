/**
 * FarmConnect — Auth API
 *
 * All functions that talk to the backend auth endpoints.
 * Keeping API calls in dedicated files (not inside components)
 * makes them easy to reuse and test.
 */
import api from './axios'

/**
 * Register a new user.
 * @param {Object} data - { email, first_name, last_name, role, password,
 *                          confirm_password, farm_name?, location?, phone? }
 * @returns {Object} { message, access_token, user }
 */
export const registerUser = async (data) => {
  const response = await api.post('/auth/register/', data)
  return response.data
}

/**
 * Log in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Object} { access_token, user }
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login/', { email, password })
  return response.data
}

/**
 * Log out the current user.
 * Blacklists the refresh token on the server.
 */
export const logoutUser = async () => {
  await api.post('/auth/logout/')
}

/**
 * Get the currently authenticated user's profile.
 * Called on app load to restore auth state.
 * @returns {Object} user
 */
export const getMe = async () => {
  const response = await api.get('/auth/me/')
  return response.data
}

/**
 * Update the current user's profile.
 * @param {Object} data - fields to update
 * @returns {Object} updated user
 */
export const updateProfile = async (data) => {
  const response = await api.patch('/auth/me/update/', data)
  return response.data
}

/**
 * Change the current user's password.
 * @param {Object} data - { old_password, new_password, confirm_password }
 */
export const changePassword = async (data) => {
  const response = await api.post('/auth/change-password/', data)
  return response.data
}
