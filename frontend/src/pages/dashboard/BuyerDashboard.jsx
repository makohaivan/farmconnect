import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Store, ShoppingCart, ClipboardList,
         CheckCircle2, Clock, Truck, Star } from 'lucide-react'
import AppLayout    from '../../components/AppLayout'
import { StatCard, Button, Spinner } from '../../components/ui'
import { useCartStore, cartItemCount } from '../../store/cartStore'
import { getBuyerOrders } from '../../api/ordersApi'
import { useAuth } from '../../hooks/useAuth'

export default function BuyerDashboard() {
  const { user }       = useAuth()
  const cartCount      = useCartStore(cartItemCount)

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBuyerOrders()
      .then(data => {
        const orders = data.results || data || []
        setStats({
          total:     orders.length,
          pending:   orders.filter(o => o.status === 'pending').length,
          onTheWay:  orders.filter(o => o.status === 'dispatched').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
        })
      })
      .catch(() => setStats({ total: 0, pending: 0, onTheWay: 0, delivered: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout
      title={`Hello, ${user?.first_name}! 👋`}
      subtitle="Find fresh produce directly from local farmers"
    >
      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders"  value={stats?.total}
            icon={ClipboardList} color="text-blue-600"    bg="bg-blue-50" />
          <StatCard label="Pending"       value={stats?.pending}
            icon={Clock}         color="text-amber-600"   bg="bg-amber-50" />
          <StatCard label="On the Way"    value={stats?.onTheWay}
            icon={Truck}         color="text-orange-600"  bg="bg-orange-50" />
          <StatCard label="Delivered"     value={stats?.delivered}
            icon={CheckCircle2}  color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      )}

      {/* Quick Links */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase
                     tracking-wider mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/buyer/products',  icon: Store,         label: 'Browse Products',
            desc: 'Fresh produce from local farmers',   color: 'bg-emerald-50 text-emerald-600' },
          { to: '/buyer/cart',      icon: ShoppingCart,  label: 'My Cart',
            desc: `${cartCount} item${cartCount !== 1 ? 's' : ''} waiting`,
            color: 'bg-blue-50 text-blue-600',          badge: cartCount },
          { to: '/buyer/orders',    icon: ClipboardList, label: 'My Orders',
            desc: 'Track your deliveries',             color: 'bg-purple-50 text-purple-600',
            badge: stats?.pending },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card-hover p-5 group flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${item.color}
                               flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              {item.badge > 0 && (
                <span className="badge badge-green">{item.badge}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600
                             transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <div className="flex items-center text-xs font-medium text-primary-600">
              Go
              <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  )
}
