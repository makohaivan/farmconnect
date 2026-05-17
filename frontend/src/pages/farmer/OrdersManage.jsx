import { useState, useEffect } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { Button, Alert, Spinner, EmptyState } from '../../components/ui'
import { printOrder } from '../../components/OrderSummary'
import api from '../../api/axios'

const STATUS_FLOW = ['pending','confirmed','packed','dispatched','delivered']
const STATUS_META = {
  pending:    { label:'Pending',    badge:'badge-yellow', icon:'🕐' },
  confirmed:  { label:'Confirmed',  badge:'badge-blue',   icon:'✅' },
  packed:     { label:'Packed',     badge:'badge-purple', icon:'📦' },
  dispatched: { label:'Dispatched', badge:'badge-orange', icon:'🚚' },
  delivered:  { label:'Delivered',  badge:'badge-green',  icon:'🎉' },
  cancelled:  { label:'Cancelled',  badge:'badge-red',    icon:'❌' },
}

function OrderCard({ order, onStatusUpdate }) {
  const [advancing, setAdvancing] = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const meta         = STATUS_META[order.status] || STATUS_META.pending
  const currentIdx   = STATUS_FLOW.indexOf(order.status)
  const nextStatus   = STATUS_FLOW[currentIdx + 1]

  const handleAdvance = async () => {
    if (!nextStatus) return
    setAdvancing(true)
    try {
      await api.patch(`/orders/${order.id}/status/`, { status: nextStatus })
      onStatusUpdate(order.id, nextStatus)
    } catch { alert('Failed to update status.') }
    finally { setAdvancing(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900">Order #{order.id}</span>
              <span className={`badge ${meta.badge}`}>{meta.icon} {meta.label}</span>
            </div>
            <p className="text-xs text-gray-500">
              Buyer: <span className="font-medium text-gray-700">{order.buyer_name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.created_at).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
            {order.delivery_address && (
              <p className="text-xs text-gray-400 mt-0.5">📍 {order.delivery_address}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-primary-600 text-lg">UGX {Number(order.total_amount).toLocaleString()}</p>
            <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
          </div>
        </div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <div className="flex gap-1 mt-3">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= currentIdx ? 'bg-primary-500' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        )}
      </div>

      {/* Items toggle */}
      <div className="border-t border-gray-100">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 flex items-center justify-between
                     text-xs font-medium text-primary-600 hover:bg-gray-50">
          <span>{expanded ? 'Hide items' : 'View items'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expanded && (
          <div className="px-5 pb-4 space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-2
                                      border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-400">{item.quantity} {item.unit} × UGX {Number(item.unit_price).toLocaleString()}</p>
                </div>
                <p className="font-semibold text-gray-700">UGX {Number(item.subtotal).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div>
          {nextStatus && order.status !== 'cancelled' && (
            <Button size="sm" loading={advancing} onClick={handleAdvance}>
              Mark {STATUS_META[nextStatus]?.label} →
            </Button>
          )}
          {order.status === 'delivered' && (
            <span className="text-xs text-emerald-600 font-semibold">🎉 Completed</span>
          )}
          {order.status === 'cancelled' && (
            <span className="text-xs text-red-500 font-semibold">❌ Cancelled by buyer</span>
          )}
        </div>
        <button onClick={() => printOrder(order, 'farmer')}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl
                     bg-farm-dark text-white hover:bg-blue-900 font-medium transition-colors">
          <Printer className="w-3.5 h-3.5" /> Print Summary
        </button>
      </div>
    </div>
  )
}

export default function OrdersManage() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    api.get('/orders/farmer/')
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusUpdate = (id, status) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))

  const counts  = STATUS_FLOW.reduce((a, s) => ({ ...a, [s]: orders.filter(o => o.status === s).length }), {})
  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <AppLayout title="Orders" subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''} received`}>
      {error && <div className="mb-5"><Alert type="error" message={error} /></div>}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === '' ? 'bg-farm-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          All ({orders.length})
        </button>
        {STATUS_FLOW.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === s ? 'bg-farm-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {STATUS_META[s].icon} {STATUS_META[s].label} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList}
          title={filter ? `No ${filter} orders` : 'No orders yet'}
          description={filter ? 'Try a different filter.' : 'Orders from buyers will appear here.'} />
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
