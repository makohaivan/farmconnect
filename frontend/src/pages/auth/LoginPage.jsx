import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Leaf, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input, Alert, Logo } from '../../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [errors, setErrors] = useState({})

  const handleChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    if (error) setError('')
  }

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required.'
    if (!form.password) e.password = 'Password is required.'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br
                      from-farm-dark via-primary-900 to-primary-800
                      flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                                     radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
                   backgroundSize: '48px 48px' }} />

        <Logo size="lg" />

        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Fresh from the farm,<br />
            straight to your door.
          </h1>
          <p className="text-primary-200 text-lg">
            Connect directly with local farmers. No middlemen, fair prices,
            and produce you can trust.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🌾', text: 'Fresh produce from verified local farmers' },
              { icon: '💰', text: 'Fair prices — farmers earn more, you pay less' },
              { icon: '🚚', text: 'Direct delivery to your door' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-primary-100 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300 text-xs relative z-10">
          © 2026 FarmConnect · Kampala, Uganda
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Sign in to your FarmConnect account
          </p>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && <Alert type="error" message={error} />}

              <Input
                label="Email address" id="email" name="email" type="email"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} error={errors.email}
                icon={Mail} required autoFocus autoComplete="email"
              />

              <Input
                label="Password" id="password" name="password" type="password"
                placeholder="Enter your password" value={form.password}
                onChange={handleChange} error={errors.password}
                icon={Lock} required autoComplete="current-password"
              />

              <Button type="submit" loading={loading} fullWidth size="lg"
                iconRight className="mt-2">
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register"
                className="text-primary-600 font-semibold hover:text-primary-700">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
