/**
 * FarmConnect — Shared UI Components
 *
 * Small, reusable components used throughout the app.
 * Building these once and reusing them keeps the UI consistent.
 */

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'white' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }
  const colors = {
    white:   'border-white border-t-transparent',
    green:   'border-primary-600 border-t-transparent',
    gray:    'border-gray-400 border-t-transparent',
  }
  return (
    <div className={`
      ${sizes[size]} ${colors[color]}
      rounded-full border-2 spinner inline-block
    `} />
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children,
  type     = 'button',
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth= false,
  onClick,
  className= '',
}) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn bg-transparent text-primary-600 hover:bg-primary-50',
  }
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && <Spinner size="sm" color={variant === 'secondary' ? 'gray' : 'white'} />}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label,
  id,
  type      = 'text',
  error,
  hint,
  required  = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="error-text">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, id, error, required, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'error', message }) {
  if (!message) return null

  const styles = {
    error:   'bg-red-50 border-red-300 text-red-700',
    success: 'bg-green-50 border-green-300 text-green-700',
    info:    'bg-blue-50 border-blue-300 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  }

  const icons = {
    error:   '✕',
    success: '✓',
    info:    'ℹ',
    warning: '⚠',
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span className="font-bold mt-0.5">{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      {label && (
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400">{label}</span>
        </div>
      )}
    </div>
  )
}

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  return (
    <div className={`font-bold ${sizes[size]} flex items-center gap-2`}>
      <span>🌾</span>
      <span>
        <span className="text-primary-600">Farm</span>
        <span className="text-farm-dark">Connect</span>
      </span>
    </div>
  )
}

// ── PageLoader ────────────────────────────────────────────────────────────────
// Shown while the app checks if the user is already logged in
export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Logo size="lg" />
      <div className="mt-8">
        <Spinner size="lg" color="green" />
      </div>
      <p className="mt-4 text-gray-500 text-sm">Loading...</p>
    </div>
  )
}
