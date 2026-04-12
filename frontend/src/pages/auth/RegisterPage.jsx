/**
 * FarmConnect — Register Page
 *
 * Two-step registration:
 * Step 1: Choose role (Farmer or Buyer)
 * Step 2: Fill in account details (fields change based on role)
 *
 * This approach makes registration feel guided and simple
 * rather than showing a long overwhelming form.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input, Alert, Logo, Spinner } from '../../components/ui'

// ── Step 1 — Role Selection ────────────────────────────────────────────────────
function RoleSelector({ selected, onSelect }) {
  const roles = [
    {
      value:       'farmer',
      icon:        '🌾',
      title:       'I am a Farmer',
      description: 'List your produce, manage orders, and sell directly to buyers across the country.',
      benefits:    ['Set your own prices', 'No middlemen', 'Get paid faster'],
    },
    {
      value:       'buyer',
      icon:        '🛒',
      title:       'I am a Buyer',
      description: 'Browse fresh produce from verified local farmers and order directly to your door.',
      benefits:    ['Fresh from the farm', 'Lower prices', 'Support local farmers'],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-farm-dark">How will you use FarmConnect?</h2>
        <p className="text-gray-500 text-sm mt-1">Choose your account type to get started</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {roles.map(role => (
          <button
            key={role.value}
            type="button"
            onClick={() => onSelect(role.value)}
            className={`
              text-left p-5 rounded-xl border-2 transition-all duration-150
              hover:border-primary-400 hover:shadow-md
              ${selected === role.value
                ? 'border-primary-600 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{role.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-farm-dark">{role.title}</h3>
                  {selected === role.value && (
                    <span className="text-primary-600 font-bold text-lg">✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                <ul className="mt-3 space-y-1">
                  {role.benefits.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-primary-600 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2 — Account Details Form ──────────────────────────────────────────────
function AccountForm({ role, formData, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <span className="text-4xl">{role === 'farmer' ? '🌾' : '🛒'}</span>
        <h2 className="text-xl font-bold text-farm-dark mt-2">
          {role === 'farmer' ? 'Farmer Account' : 'Buyer Account'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">Fill in your details below</p>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          id="first_name"
          name="first_name"
          placeholder="John"
          value={formData.first_name}
          onChange={onChange}
          error={errors.first_name}
          required
          autoFocus
        />
        <Input
          label="Last name"
          id="last_name"
          name="last_name"
          placeholder="Doe"
          value={formData.last_name}
          onChange={onChange}
          error={errors.last_name}
          required
        />
      </div>

      {/* Email */}
      <Input
        label="Email address"
        id="email"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={onChange}
        error={errors.email}
        required
        autoComplete="email"
      />

      {/* Phone */}
      <Input
        label="Phone number"
        id="phone"
        name="phone"
        type="tel"
        placeholder="+256 700 000 000"
        value={formData.phone}
        onChange={onChange}
        error={errors.phone}
        hint="Used for order updates and notifications"
      />

      {/* Farmer-specific fields */}
      {role === 'farmer' && (
        <>
          <Input
            label="Farm name"
            id="farm_name"
            name="farm_name"
            placeholder="e.g. Green Valley Farm"
            value={formData.farm_name}
            onChange={onChange}
            error={errors.farm_name}
            required
            hint="This will be shown to buyers on your listings"
          />
          <Input
            label="Farm location"
            id="location"
            name="location"
            placeholder="e.g. Wakiso, Uganda"
            value={formData.location}
            onChange={onChange}
            error={errors.location}
            required
            hint="Helps buyers find farms near them"
          />
        </>
      )}

      {/* Password */}
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        placeholder="At least 8 characters"
        value={formData.password}
        onChange={onChange}
        error={errors.password}
        required
        autoComplete="new-password"
        hint="Minimum 8 characters"
      />

      {/* Confirm Password */}
      <Input
        label="Confirm password"
        id="confirm_password"
        name="confirm_password"
        type="password"
        placeholder="Repeat your password"
        value={formData.confirm_password}
        onChange={onChange}
        error={errors.confirm_password}
        required
        autoComplete="new-password"
      />
    </div>
  )
}

// ── Main Register Page ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth()

  const [step, setStep] = useState(1)   // 1 = role selection, 2 = form

  const [formData, setFormData] = useState({
    role:             '',
    first_name:       '',
    last_name:        '',
    email:            '',
    phone:            '',
    farm_name:        '',
    location:         '',
    password:         '',
    confirm_password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [errors,  setErrors]  = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (error) setError('')
  }

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }))
  }

  // Step 1 validation — role must be selected
  const validateStep1 = () => {
    if (!formData.role) {
      setError('Please select an account type to continue.')
      return false
    }
    setError('')
    return true
  }

  // Step 2 validation — all required fields
  const validateStep2 = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.'
    if (!formData.last_name.trim())  newErrors.last_name  = 'Last name is required.'

    if (!formData.email) {
      newErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (formData.role === 'farmer') {
      if (!formData.farm_name.trim()) newErrors.farm_name = 'Farm name is required.'
      if (!formData.location.trim())  newErrors.location  = 'Farm location is required.'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password.'
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setError('')

    try {
      await register(formData)
      // register() handles redirect
    } catch (err) {
      // Handle server-side validation errors
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        // Map server errors to field-level errors
        const mapped = {}
        Object.entries(serverErrors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(mapped)
      } else {
        setError(
          err.response?.data?.error ||
          'Registration failed. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-farm-light
                    flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg fade-in">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <p className="text-gray-500 text-sm">Create your free account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                text-sm font-semibold transition-colors
                ${step >= s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-400'
                }
              `}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div className={`
                  w-16 h-0.5 transition-colors
                  ${step > s ? 'bg-primary-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate>

            {/* Error alert */}
            {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

            {/* Step 1 — Role selection */}
            {step === 1 && (
              <>
                <RoleSelector
                  selected={formData.role}
                  onSelect={handleRoleSelect}
                />
                <Button
                  type="button"
                  onClick={handleNext}
                  fullWidth
                  size="lg"
                  className="mt-6"
                >
                  Continue →
                </Button>
              </>
            )}

            {/* Step 2 — Account details */}
            {step === 2 && (
              <>
                <AccountForm
                  role={formData.role}
                  formData={formData}
                  onChange={handleChange}
                  errors={errors}
                />
                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    className="w-32"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    fullWidth
                    size="lg"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 font-medium hover:text-primary-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
