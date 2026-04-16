/**
 * FarmConnect — Buyer Orders Page
 */
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth }       from '../../hooks/useAuth'
import { getBuyerOrders, cancelOrder } from '../../api/ordersApi'
import { Button, Logo, Alert, Spinner } from '../../components/ui'
import OrderSummary from '../../components/OrderSummary'

const STATUS_STYLES = {
  pending:    { badge: 'bg-yellow-100 text-yellow-800', label: 'Pending',    icon: '🕐', desc: 'Waiting for farmer to confirm' },
  confirmed:  { badge: 'bg-blue-100 text-blue-800',    label: 'Confirmed',  icon: '✅', desc: 'Farmer has confirmed your order' },
  packed:     { badge: 'bg-purple-100 text-purple-800',label: 'Packed',     icon: '📦', desc: 'Your order is packed and ready' },
  dispatched: { badge: 'bg-orange-100 text-orange-800',label: 'Dispatched', icon: '🚚', desc: 'Your order is on the way!' },
  delivered:  { badge: 'bg-green-100 text-green-800',  label: 'Delivered',  icon: '🎉', desc: 'Order delivered successfully' },
  cancelled:  { badge: 'bg-red-100 text-red-800',      label: 'Cancelled',  icon: '❌', desc: 'Order was cancelled' },
}
const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered']

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #order-summary-print, #order-summary-print * { visibility: visible !important; }
    #order-summary-print {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important;
      padding: 24px !important;
      background: white !important;
    }
    .no-print { display: none !important; }
  }
`

function injectPrintStyles() {
  if (!document.getElementById('farmconnect-print-styles')) {
    const style = document.createElement('style')
    style.id = 'farmconnect-print-styles'
    style.innerHTML = PRINT_STYLES
    document.head.appendChild(style)
  }
}

function OrderCard({ order, onCancel }) {
  const [expanded,   setExpanded]   = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showPrint,  setShowPrint]  = useState(false)

  const s           = STATUS_STYLES[order.status] || STATUS_STYLES.pending
  const currentStep = STATUS_FLOW.indexOf(order.status)
  const canCancel   = order.status === 'pending'

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try { await onCancel(order.id) }
    finally { setCancelling(false) }
  }

  const handlePrint = () => {
    injectPrintStyles()
    setShowPrint(true)
    setTimeout(() => window.print(), 200)
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
            <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
          </div>
        </div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((st, i) => (
              <div key={st} className="flex-1">
                <div className={`h-2 rounded-full ${
                  i <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        )}

        {/* Delivery info */}
        <div className="text-xs text-gray-500 space-y-0.5 mt-2">
          {order.farm_name && (
            <p>🌾 Farmer: <span className="font-medium text-gray-700">{order.farm_name}</span></p>
          )}
          {order.delivery_address && <p>📍 {order.delivery_address}</p>}
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
          <div className="px-5 pb-3 space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-2
                                      border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} {item.unit} × UGX {Number(item.unit_price).toLocaleString()}
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
        <div className="flex items-center gap-2">
          {canCancel && (
            <Button variant="danger" size="sm"
              loading={cancelling} onClick={handleCancel}>
              Cancel Order
            </Button>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg
                     bg-farm-dark text-white hover:bg-blue-900 font-medium
                     transition-colors"
        >
          🖨️ Print / Save Summary
        </button>
      </div>

      {/* Hidden print area */}
      {showPrint && (
        <div style={{ display: 'none' }}>
          <OrderSummary order={order} mode="buyer" />
        </div>
      )}
    </div>
  )
}

export default function BuyerOrders() {
  const { user, logout } = useAuth()
  const location         = useLocation()

  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(
    location.state?.success
      ? '✅ Order placed! The farmer will confirm shortly. Print your summary below.'
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
    if (success) setTimeout(() => setSuccess(''), 6000)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between no-print">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/buyer/dashboard"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <Link to="/buyer/products"
            className="text-sm text-primary-600 hover:underline font-medium">
            Browse Products
          </Link>
          <Link to="/buyer/cart" className="text-xl">🛒</Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 fade-in no-print">
        <h1 className="text-2xl font-bold text-farm-dark mb-6">My Orders</h1>

        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
        {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { value: '',           label: `All (${orders.length})` },
            { value: 'pending',    label: `🕐 Pending` },
            { value: 'confirmed',  label: `✅ Confirmed` },
            { value: 'dispatched', label: `🚚 On the Way` },
            { value: 'delivered',  label: `🎉 Delivered` },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              {statusFilter ? 'Try a different filter.' : 'Browse products and place your first order!'}
            </p>
            {!statusFilter && (
              <Link to="/buyer/products"><Button>Browse Products</Button></Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
