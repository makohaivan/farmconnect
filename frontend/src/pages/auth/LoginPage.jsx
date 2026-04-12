/**
 * FarmConnect — Login Page
 *
 * Clean, professional login form.
 * Handles: form state, validation, API call, error display, loading state.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input, Alert, Logo } from '../../components/ui'

export default function LoginPage() {
  const { login } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    email:    '',
    password: '',
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [errors,  setErrors]  = useState({})

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  // Client-side validation before sending to server
  const validate = () => {
    const newErrors = {}
    if (!formData.email)    newErrors.email    = 'Email is required.'
    if (!formData.password) newErrors.password = 'Password is required.'
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      // login() handles redirect on success
    } catch (err) {
      const msg = err.response?.data?.error ||
                  'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-farm-light
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">

        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-farm-dark">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to your FarmConnect account
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Server error */}
            {error && <Alert type="error" message={error} />}

            {/* Email */}
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
              autoFocus
            />

            {/* Password */}
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer links */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 font-medium hover:text-primary-700 hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo credentials hint for educational use */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 text-center">
          <strong>Demo:</strong> Register a farmer and buyer account to test the flow
        </div>
      </div>
    </div>
  )
}
