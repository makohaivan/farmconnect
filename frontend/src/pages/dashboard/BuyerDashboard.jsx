import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth }      from '../../hooks/useAuth'
import { useCartStore, cartItemCount } from '../../store/cartStore'
import { Button, Logo, Spinner } from '../../components/ui'
import { getBuyerOrders } from '../../api/ordersApi'

export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const totalCartItems = useCartStore(cartItemCount)

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBuyerOrders()
      .then(data => {
        const orders = data.results || data || []
        setStats({
          total:      orders.length,
          pending:    orders.filter(o => o.status === 'pending').length,
          onTheWay:   orders.filter(o => o.status === 'dispatched').length,
          delivered:  orders.filter(o => o.status === 'delivered').length,
        })
      })
      .catch(() => setStats({ total: 0, pending: 0, onTheWay: 0, delivered: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    { to: '/buyer/products', icon: '🌾', label: 'Browse Products', desc: 'Find fresh produce from local farmers', color: 'text-green-600 bg-green-50' },
    { to: '/buyer/cart',     icon: '🛒', label: 'My Cart',         desc: `${totalCartItems} item${totalCartItems !== 1 ? 's' : ''} in cart`, color: 'text-blue-600 bg-blue-50', badge: totalCartItems },
    { to: '/buyer/orders',   icon: '📋', label: 'My Orders',       desc: 'Track your order deliveries', color: 'text-purple-600 bg-purple-50', badge: stats?.pending || 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Link to="/buyer/cart" className="relative">
            <span className="text-2xl">🛒</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600
                               text-white text-xs rounded-full flex items-center
                               justify-center font-bold">
                {totalCartItems}
              </span>
            )}
          </Link>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">Buyer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center
                          justify-center text-blue-700 font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 fade-in">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">
            Hello, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Find fresh produce directly from local farmers near you.
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" color="green" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Orders',  value: stats?.total,    icon: '📋', color: 'bg-blue-50 text-blue-700' },
              { label: 'Pending',       value: stats?.pending,  icon: '🕐', color: 'bg-yellow-50 text-yellow-700' },
              { label: 'On the Way',    value: stats?.onTheWay, icon: '🚚', color: 'bg-orange-50 text-orange-700' },
              { label: 'Delivered',     value: stats?.delivered,icon: '🎉', color: 'bg-green-50 text-green-700' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center
                                 justify-center text-xl mb-2`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold text-farm-dark">{s.value ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <h2 className="font-semibold text-farm-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to}
              className="card p-5 flex items-center gap-4
                         hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 rounded-xl ${link.color}
                               flex items-center justify-center text-2xl shrink-0`}>
                {link.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-farm-dark text-sm
                                group-hover:text-primary-600 transition-colors">
                    {link.label}
                  </p>
                  {link.badge > 0 && (
                    <span className="badge badge-green text-xs">{link.badge}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <span className="text-gray-300 group-hover:text-primary-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
