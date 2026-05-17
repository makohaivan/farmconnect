import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, MapPin, Home, Wheat } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button, Input, Alert, Logo } from '../../components/ui'

function RoleCard({ value, selected, onSelect, icon, title, description, perks }) {
  return (
    <button type="button" onClick={() => onSelect(value)}
      className={`text-left w-full p-4 rounded-xl border-2 transition-all duration-150
                  ${selected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                         text-xl shrink-0 ${
          selected ? 'bg-primary-100' : 'bg-gray-100'
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className={`font-semibold text-sm ${
              selected ? 'text-primary-700' : 'text-gray-800'
            }`}>
              {title}
            </p>
            {selected && (
              <span className="w-5 h-5 bg-primary-600 rounded-full flex
                               items-center justify-center text-white text-xs">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 mb-2">{description}</p>
          <div className="flex flex-wrap gap-1">
            {perks.map(p => (
              <span key={p} className="text-xs bg-gray-100 text-gray-600
                                       px-2 py-0.5 rounded-full">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    role: '', email: '', first_name: '', last_name: '',
    phone: '', farm_name: '', location: '',
    password: '', confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [errors, setErrors]   = useState({})

  const handleChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    if (error) setError('')
  }

  const validateStep1 = () => {
    if (!form.role) { setError('Please choose an account type.'); return false }
    return true
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required.'
    if (!form.last_name.trim())  e.last_name  = 'Required.'
    if (!form.email)             e.email      = 'Required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.'
    if (form.role === 'farmer' && !form.farm_name.trim()) e.farm_name = 'Required.'
    if (form.role === 'farmer' && !form.location.trim())  e.location  = 'Required.'
    if (!form.password)          e.password    = 'Required.'
    else if (form.password.length < 8) e.password = 'Min 8 characters.'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleNext = () => { if (validateStep1()) { setError(''); setStep(2) } }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)
    setError('')
    try {
      await register(form)
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        const mapped = {}
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v
        })
        setErrors(mapped)
      } else {
        setError(err.response?.data?.error || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center
                    p-4 py-10">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3"><Logo size="lg" /></div>
          <p className="text-gray-500 text-sm">Create your free account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                               text-xs font-bold transition-all ${
                step >= s
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div className={`w-12 h-0.5 rounded transition-colors ${
                  step > s ? 'bg-primary-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="mb-5"><Alert type="error" message={error} /></div>}

            {/* STEP 1 — Role */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="mb-5">
                  <h2 className="font-display font-bold text-xl text-gray-900">
                    How will you use FarmConnect?
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose your account type to get started
                  </p>
                </div>

                <RoleCard
                  value="farmer" selected={form.role === 'farmer'}
                  onSelect={r => setForm(p => ({ ...p, role: r }))}
                  icon="🌾" title="I'm a Farmer"
                  description="List your produce and sell directly to buyers"
                  perks={['Set your own prices', 'No middlemen', 'Get paid faster']}
                />
                <RoleCard
                  value="buyer" selected={form.role === 'buyer'}
                  onSelect={r => setForm(p => ({ ...p, role: r }))}
                  icon="🛒" title="I'm a Buyer"
                  description="Browse fresh produce directly from farmers"
                  perks={['Fresh from farm', 'Fair prices', 'Support local']}
                />

                <Button type="button" onClick={handleNext} fullWidth size="lg"
                  className="mt-2">
                  Continue →
                </Button>
              </div>
            )}

            {/* STEP 2 — Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="mb-5">
                  <h2 className="font-display font-bold text-xl text-gray-900">
                    {form.role === 'farmer' ? '🌾 Farmer Account' : '🛒 Buyer Account'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in your details</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="First name" id="first_name" name="first_name"
                    placeholder="John" value={form.first_name}
                    onChange={handleChange} error={errors.first_name}
                    icon={User} required autoFocus />
                  <Input label="Last name" id="last_name" name="last_name"
                    placeholder="Doe" value={form.last_name}
                    onChange={handleChange} error={errors.last_name}
                    icon={User} required />
                </div>

                <Input label="Email address" id="email" name="email" type="email"
                  placeholder="you@example.com" value={form.email}
                  onChange={handleChange} error={errors.email}
                  icon={Mail} required autoComplete="email" />

                <Input label="Phone number" id="phone" name="phone" type="tel"
                  placeholder="+256 700 000 000" value={form.phone}
                  onChange={handleChange} error={errors.phone}
                  icon={Phone} />

                {form.role === 'farmer' && (
                  <>
                    <Input label="Farm name" id="farm_name" name="farm_name"
                      placeholder="e.g. Green Valley Farm" value={form.farm_name}
                      onChange={handleChange} error={errors.farm_name}
                      icon={Wheat} required />
                    <Input label="Farm location" id="location" name="location"
                      placeholder="e.g. Wakiso, Uganda" value={form.location}
                      onChange={handleChange} error={errors.location}
                      icon={MapPin} required />
                  </>
                )}

                <Input label="Password" id="password" name="password" type="password"
                  placeholder="At least 8 characters" value={form.password}
                  onChange={handleChange} error={errors.password}
                  icon={Lock} required hint="Minimum 8 characters" />

                <Input label="Confirm password" id="confirm_password"
                  name="confirm_password" type="password"
                  placeholder="Repeat your password" value={form.confirm_password}
                  onChange={handleChange} error={errors.confirm_password}
                  icon={Lock} required />

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="secondary"
                    onClick={() => setStep(1)} className="w-28">
                    ← Back
                  </Button>
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    {loading ? 'Creating account…' : 'Create Account'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login"
              className="text-primary-600 font-semibold hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
