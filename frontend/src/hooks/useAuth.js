/**
 * FarmConnect — useAuth Hook
 *
 * A custom hook that wraps all authentication logic.
 * Components import this hook to:
 * - Read auth state (user, isLoggedIn, isFarmer, isBuyer)
 * - Call auth actions (login, register, logout)
 *
 * This separates concerns: components handle UI,
 * this hook handles the auth business logic.
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { loginUser, registerUser, logoutUser } from '../api/authApi'

export const useAuth = () => {
  const navigate = useNavigate()
  const {
    user,
    accessToken,
    isLoading,
    setAuth,
    clearAuth,
    updateUser,
  } = useAuthStore()

  const isLoggedIn = !!accessToken
  const isFarmer   = user?.role === 'farmer'
  const isBuyer    = user?.role === 'buyer'

  /**
   * Log in with email + password.
   * On success: stores auth state and redirects to dashboard.
   * On failure: throws the error so the form can display it.
   */
  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password)
    setAuth(data.user, data.access_token)

    // Redirect to the correct dashboard based on role
    if (data.user.role === 'farmer') {
      navigate('/farmer/dashboard')
    } else {
      navigate('/buyer/dashboard')
    }
  }, [setAuth, navigate])

  /**
   * Register a new account.
   * On success: stores auth state and redirects to dashboard.
   */
  const register = useCallback(async (formData) => {
    const data = await registerUser(formData)
    setAuth(data.user, data.access_token)

    if (data.user.role === 'farmer') {
      navigate('/farmer/dashboard')
    } else {
      navigate('/buyer/dashboard')
    }
  }, [setAuth, navigate])

  /**
   * Log out the current user.
   * Clears state and redirects to home.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch {
      // Even if the server call fails, we still clear local state
    } finally {
      clearAuth()
      navigate('/')
    }
  }, [clearAuth, navigate])

  return {
    // State
    user,
    accessToken,
    isLoading,
    isLoggedIn,
    isFarmer,
    isBuyer,
    // Actions
    login,
    register,
    logout,
    updateUser,
  }
}
