/**
 * FarmConnect — Farmer Orders Page
 * View incoming orders, advance status, print/download order summaries.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Logo, Alert, Spinner } from '../../components/ui'
import { printOrder } from '../../components/OrderSummary'
import api from '../../api/axios'

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered']

const STATUS_STYLES = {
  pending:    { badge: 'bg-yellow-100 text-yellow-800',  label: 'Pending',    icon: '🕐' },
  confirmed:  { badge: 'bg-blue-100 text-blue-800',      label: 'Confirmed',  icon: '✅' },
  packed:     { badge: 'bg-purple-100 text-purple-800',  label: 'Packed',     icon: '📦' },
  dispatched: { badge: 'bg-orange-100 text-orange-800',  label: 'Dispatched', icon: '🚚' },
  delivered:  { badge: 'bg-green-100 text-green-800',    label: 'Delivered',  icon: '🎉' },
  cancelled:  { badge: 'bg-red-100 text-red-800',        label: 'Cancelled',  icon: '❌' },
}


// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusUpdate }) {
  const [advancing,  setAdvancing]  = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const currentIndex = STATUS_FLOW.indexOf(order.status)
  const nextStatus   = STATUS_FLOW[currentIndex + 1]
  const nextLabel    = nextStatus ? STATUS_STYLES[nextStatus]?.label : null
  const s            = STATUS_STYLES[order.status] || STATUS_STYLES.pending

  const handleAdvance = async () => {
    if (!nextStatus) return
    setAdvancing(true)
    try {
      await api.patch(`/orders/${order.id}/status/`, { status: nextStatus })
      onStatusUpdate(order.id, nextStatus)
    } catch {
      alert('Failed to update order status.')
    } finally {
      setAdvancing(false)
    }
  }

  const handlePrint = () => printOrder(order, 'farmer')

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="font-semibold text-farm-dark">Order #{order.id}</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5
                                rounded-full text-xs font-medium ${s.badge}`}>
                {s.icon} {s.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Buyer: <span className="font-medium text-gray-700">{order.buyer_name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(order.created_at).toLocaleDateString('en-UG', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {order.delivery_address && (
              <p className="text-xs text-gray-400 mt-0.5">
                📍 {order.delivery_address}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-primary-600 text-lg">
              UGX {Number(order.total_amount).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
          </div>
        </div>

        {/* Progress dots */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center gap-1 mt-3">
            {STATUS_FLOW.map((st, i) => (
              <div key={st} className="flex items-center gap-1 flex-1">
                <div className={`h-2 rounded-full w-full transition-colors ${
                  i <= currentIndex ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items toggle */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 text-xs text-primary-600
                     hover:bg-gray-50 font-medium flex justify-between text-left"
        >
          <span>{expanded ? 'Hide items' : 'View items'}</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="px-5 pb-3 space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center
                                      text-sm py-2 border-b border-gray-50 last:border-0">
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

      {/* Actions Footer */}
      <div className="px-5 pb-4 pt-3 border-t border-gray-100
                      flex items-center justify-between flex-wrap gap-3">
        {/* Status advance */}
        <div className="flex items-center gap-2">
          {nextStatus && order.status !== 'cancelled' && (
            <Button size="sm" loading={advancing} onClick={handleAdvance}>
              {advancing ? 'Updating...' : `Mark ${nextLabel} →`}
            </Button>
          )}
          {order.status === 'delivered' && (
            <span className="text-xs text-green-600 font-medium">
              🎉 Order completed
            </span>
          )}
          {order.status === 'cancelled' && (
            <span className="text-xs text-red-500 font-medium">
              ❌ Order cancelled by buyer
            </span>
          )}
        </div>

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg
                     bg-farm-dark text-white hover:bg-blue-900 transition-colors
                     font-medium"
        >
          🖨️ Print / Save Summary
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersManage() {
  const { user, logout } = useAuth()

  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    api.get('/orders/farmer/')
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    )
  }

  const filtered = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  const counts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between no-print">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/farmer/dashboard"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center
                          justify-center text-primary-700 font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 fade-in no-print">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-farm-dark">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} received
          </p>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-farm-dark text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({orders.length})
          </button>
          {STATUS_FLOW.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-farm-dark text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STATUS_STYLES[s].icon} {STATUS_STYLES[s].label} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="green" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-6xl mb-4">📋</p>
            <h2 className="text-lg font-semibold text-farm-dark">
              {statusFilter ? `No ${statusFilter} orders` : 'No orders yet'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter
                ? 'Try a different filter.'
                : 'Orders from buyers will appear here once they purchase your products.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
