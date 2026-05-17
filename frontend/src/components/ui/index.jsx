/**
 * FarmConnect — Design System Components
 * All shared UI primitives used across the app.
 * Uses Lucide React for icons.
 */
import {
  Loader2, AlertCircle, CheckCircle2, Info, X,
  Eye, EyeOff, ChevronRight, Leaf
} from 'lucide-react'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return (
    <Loader2 className={`${sizes[size]} animate-spin ${className}`} />
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children, type = 'button', variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, className = '', icon: Icon, iconRight
}) {
  const base = 'btn'
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }
  const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]}
                  ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading
        ? <Spinner size="sm" className="text-current" />
        : Icon && <Icon className="w-4 h-4" />
      }
      {children}
      {iconRight && !loading && <ChevronRight className="w-4 h-4 opacity-60" />}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label, id, type = 'text', error, hint, required = false,
  className = '', icon: Icon, ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`input ${error ? 'input-error' : ''}
                      ${Icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="error-text">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {hint && !error && <p className="hint-text">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, id, error, required, children, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
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
      {error && (
        <p className="error-text">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'error', message, onClose }) {
  if (!message) return null

  const config = {
    error:   { icon: AlertCircle,    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon_c: 'text-red-500' },
    success: { icon: CheckCircle2,   bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',icon_c: 'text-emerald-500' },
    info:    { icon: Info,            bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon_c: 'text-blue-500' },
    warning: { icon: AlertCircle,    bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon_c: 'text-amber-500' },
  }

  const { icon: Icon, bg, border, text, icon_c } = config[type] || config.error

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                     text-sm ${bg} ${border} ${text}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${icon_c}`} />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ size = 'md', collapsed = false }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }
  return (
    <div className={`flex items-center gap-2 font-display font-bold ${sizes[size]}`}>
      <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center
                      justify-center shadow-sm shrink-0">
        <Leaf className="w-4 h-4 text-white" />
      </div>
      {!collapsed && (
        <span>
          <span className="text-primary-600">Farm</span>
          <span className="text-farm-dark">Connect</span>
        </span>
      )}
    </div>
  )
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Logo size="lg" />
      <Spinner size="xl" className="text-primary-600 mt-8" />
      <p className="mt-4 text-sm text-gray-500 font-medium">Loading FarmConnect…</p>
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
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400 font-medium">{label}</span>
        </div>
      )}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                        justify-center mb-5">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'text-primary-600',
                           bg = 'bg-primary-50', trend, suffix = '' }) {
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center
                       justify-center mb-4`}>
        {Icon && <Icon className={`w-5 h-5 ${color}`} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display">
        {value ?? '—'}{suffix}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-2 font-medium ${
          trend >= 0 ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
        </p>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full
                       ${sizes[size]} max-h-[90vh] flex flex-col animate-fade-up`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-5
                          border-b border-gray-100 shrink-0">
            <h2 className="font-display font-bold text-lg text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100
                         transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message,
                                confirmLabel = 'Confirm', variant = 'danger',
                                loading = false }) {
  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                         mx-auto mb-4 ${
          variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <AlertCircle className={`w-7 h-7 ${
            variant === 'danger' ? 'text-red-600' : 'text-amber-600'
          }`} />
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} fullWidth loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
