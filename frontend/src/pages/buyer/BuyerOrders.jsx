/**
 * FarmConnect — Buyer Orders Page
 * View orders, track status, cancel pending orders,
 * leave reviews on delivered orders, print order summary.
 */
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth }       from '../../hooks/useAuth'
import { getBuyerOrders, cancelOrder, postReview } from '../../api/ordersApi'
import { Button, Logo, Alert, Spinner } from '../../components/ui'
import { printOrder } from '../../components/OrderSummary'

const STATUS_STYLES = {
  pending:    { badge: 'bg-yellow-100 text-yellow-800', label: 'Pending',    icon: '🕐', desc: 'Waiting for farmer to confirm' },
  confirmed:  { badge: 'bg-blue-100 text-blue-800',    label: 'Confirmed',  icon: '✅', desc: 'Farmer has confirmed your order' },
  packed:     { badge: 'bg-purple-100 text-purple-800',label: 'Packed',     icon: '📦', desc: 'Your order is packed and ready' },
  dispatched: { badge: 'bg-orange-100 text-orange-800',label: 'Dispatched', icon: '🚚', desc: 'Your order is on the way!' },
  delivered:  { badge: 'bg-green-100 text-green-800',  label: 'Delivered',  icon: '🎉', desc: 'Order delivered successfully' },
  cancelled:  { badge: 'bg-red-100 text-red-800',      label: 'Cancelled',  icon: '❌', desc: 'Order was cancelled' },
}
const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered']

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`${sizes[size]} transition-all duration-100
                      ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <span className={
            star <= (hovered || value)
              ? 'text-yellow-400'
              : 'text-gray-300'
          }>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Review Form (shown on delivered orders) ───────────────────────────────────
function ReviewForm({ order, onReviewSubmitted }) {
  const [expanded,   setExpanded]   = useState(false)
  const [reviews,    setReviews]    = useState({}) // { product_id: { rating, comment } }
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')

  // Get unique products from the order
  const products = order.items || []

  const setRating = (productId, rating) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }))
  }

  const setComment = (productId, comment) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }))
  }

  const handleSubmit = async () => {
    // Must have at least one review with a rating
    const toSubmit = products.filter(
      item => reviews[item.product]?.rating
    )

    if (toSubmit.length === 0) {
      setError('Please give at least one product a star rating.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Submit each review
      for (const item of toSubmit) {
        const rev = reviews[item.product]
        await postReview({
          order_id:   order.id,
          product_id: item.product,
          rating:     rev.rating,
          comment:    rev.comment || '',
        })
      }
      setSuccess(`Thank you! ${toSubmit.length} review${toSubmit.length > 1 ? 's' : ''} submitted.`)
      setExpanded(false)
      if (onReviewSubmitted) onReviewSubmitted(order.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border-t border-gray-100 mt-1">
      {success ? (
        <div className="px-5 py-3">
          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
            ⭐ {success}
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-3 text-left text-sm font-medium
                       text-yellow-700 bg-yellow-50 hover:bg-yellow-100
                       transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              ⭐ Leave a Review
              <span className="text-xs font-normal text-yellow-600">
                — How was your order?
              </span>
            </span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="px-5 py-4 space-y-4 bg-yellow-50/50 fade-in">
              {error && (
                <Alert type="error" message={error} />
              )}

              {products.map(item => (
                <div key={item.product || item.product_name}
                  className="bg-white rounded-xl p-4 border border-yellow-100">
                  <p className="font-medium text-farm-dark text-sm mb-3">
                    {item.product_name}
                  </p>

                  {/* Star rating */}
                  <div className="flex items-center gap-3 mb-3">
                    <StarRating
                      value={reviews[item.product]?.rating || 0}
                      onChange={(r) => setRating(item.product, r)}
                    />
                    <span className="text-xs text-gray-500">
                      {reviews[item.product]?.rating
                        ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviews[item.product].rating]
                        : 'Click to rate'}
                    </span>
                  </div>

                  {/* Comment */}
                  <textarea
                    value={reviews[item.product]?.comment || ''}
                    onChange={e => setComment(item.product, e.target.value)}
                    placeholder="Share your experience (optional)..."
                    className="input h-16 resize-none text-sm"
                  />
                </div>
              ))}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpanded(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={submitting}
                  onClick={handleSubmit}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  {submitting ? 'Submitting...' : '⭐ Submit Review'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, onReviewSubmitted }) {
  const [expanded,   setExpanded]   = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reviewed,   setReviewed]   = useState(order.has_review || false)

  const s           = STATUS_STYLES[order.status] || STATUS_STYLES.pending
  const currentStep = STATUS_FLOW.indexOf(order.status)
  const canCancel   = order.status === 'pending'
  const canReview   = order.status === 'delivered' && !reviewed

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try { await onCancel(order.id) }
    finally { setCancelling(false) }
  }

  const handleReviewSubmitted = (orderId) => {
    setReviewed(true)
    if (onReviewSubmitted) onReviewSubmitted(orderId)
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-farm-dark">Order #{order.id}</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5
                                rounded-full text-xs font-medium ${s.badge}`}>
                {s.icon} {s.label}
              </span>
              {order.status === 'delivered' && reviewed && (
                <span className="badge bg-yellow-100 text-yellow-700">
                  ⭐ Reviewed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{s.desc}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(order.created_at).toLocaleDateString('en-UG', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-primary-600 text-lg">
              UGX {Number(order.total_amount).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {order.items?.length || 0} item(s)
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((st, i) => (
              <div key={st} className="flex-1">
                <div className={`h-2 rounded-full transition-all ${
                  i <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-0.5 mt-2">
          {order.farm_name && (
            <p>🌾 Farmer:
              <span className="font-medium text-gray-700 ml-1">
                {order.farm_name}
              </span>
            </p>
          )}
          {order.delivery_address && (
            <p>📍 {order.delivery_address}</p>
          )}
        </div>
      </div>

      {/* Items toggle */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 text-xs text-primary-600
                     hover:bg-gray-50 font-medium flex justify-between"
        >
          <span>{expanded ? 'Hide items' : 'View items'}</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="px-5 pb-3">
            {order.items?.map((item, i) => (
              <div key={i}
                className="flex justify-between text-sm py-2.5
                           border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} {item.unit} ×
                    UGX {Number(item.unit_price).toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold text-gray-700">
                  UGX {Number(item.subtotal).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 pt-3 border-t border-gray-100
                      flex items-center justify-between flex-wrap gap-2">
        <div>
          {canCancel && (
            <Button variant="danger" size="sm"
              loading={cancelling} onClick={handleCancel}>
              Cancel Order
            </Button>
          )}
        </div>
        <button
          onClick={() => printOrder(order, 'buyer')}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg
                     bg-farm-dark text-white hover:bg-blue-900 font-medium
                     transition-colors"
        >
          🖨️ Print / Save Summary
        </button>
      </div>

      {/* Review section — only on delivered orders */}
      {canReview && (
        <ReviewForm
          order={order}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BuyerOrders() {
  const { user, logout } = useAuth()
  const location         = useLocation()

  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(
    location.state?.success
      ? '✅ Order placed! The farmer will confirm shortly.'
      : ''
  )
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    getBuyerOrders()
      .then(data => setOrders(data.results || data || []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (success) setTimeout(() => setSuccess(''), 5000)
  }, [success])

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId)
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ))
      setSuccess('Order cancelled successfully.')
    } catch {
      setError('Failed to cancel order.')
    }
  }

  const filtered = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  // Count delivered unreviewed orders for badge
  const pendingReviews = orders.filter(
    o => o.status === 'delivered' && !o.has_review
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/buyer/dashboard"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <Link to="/buyer/products"
            className="text-sm text-primary-600 hover:underline font-medium">
            Browse Products
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/buyer/cart" className="text-2xl">🛒</Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-farm-dark">My Orders</h1>
          {pendingReviews > 0 && (
            <p className="text-sm text-yellow-700 bg-yellow-50 border
                          border-yellow-200 rounded-lg px-3 py-2 mt-2
                          flex items-center gap-2">
              ⭐ You have {pendingReviews} delivered order{pendingReviews > 1 ? 's' : ''} waiting for a review!
            </p>
          )}
        </div>

        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
        {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { value: '',           label: `All (${orders.length})` },
            { value: 'pending',    label: `🕐 Pending (${orders.filter(o=>o.status==='pending').length})` },
            { value: 'confirmed',  label: `✅ Confirmed` },
            { value: 'dispatched', label: `🚚 On the Way` },
            { value: 'delivered',  label: `🎉 Delivered (${orders.filter(o=>o.status==='delivered').length})` },
            { value: 'cancelled',  label: `❌ Cancelled` },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-farm-dark text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="green" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-6xl mb-4">📋</p>
            <h2 className="text-lg font-semibold text-farm-dark">
              {statusFilter ? 'No orders with this status' : 'No orders yet'}
            </h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              {statusFilter
                ? 'Try a different filter.'
                : 'Browse fresh produce and place your first order!'}
            </p>
            {!statusFilter && (
              <Link to="/buyer/products"><Button>Browse Products</Button></Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleCancel}
                onReviewSubmitted={() => {}}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
