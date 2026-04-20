import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Logo, Spinner } from '../../components/ui'
import { getMyListings } from '../../api/productsApi'
import ChatWidget from '../../components/ChatWidget'

export default function FarmerDashboard() {
  const { user, logout } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyListings()
      .then(data => {
        const products  = data.results || []
        setStats({
          total:      products.length,
          available:  products.filter(p => p.is_available).length,
          outOfStock: products.filter(p => p.quantity === 0).length,
        })
      })
      .catch(() => setStats({ total: 0, available: 0, outOfStock: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    { to: '/farmer/products',  icon: '📦', label: 'My Products', desc: 'Add, edit and manage your listings',     badge: stats?.total ?? null },
    { to: '/farmer/orders',    icon: '📋', label: 'Orders',      desc: 'View and fulfil incoming orders',        badge: null },
    { to: '/farmer/insights',  icon: '✨', label: 'AI Insights', desc: 'AI-powered sales analysis and tips',     badge: null, highlight: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">
              {user?.farmerprofile?.farm_name || 'Farmer'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center
                          justify-center text-primary-700 font-bold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <Link to="/profile/edit"
            className="text-xs px-3 py-2 rounded-lg bg-gray-100
                       text-gray-600 hover:bg-gray-200 font-medium">
            ✏️ Profile
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">
            Welcome, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.farmerprofile?.farm_name
              ? `${user.farmerprofile.farm_name} · ${user.farmerprofile.location || ''}`
              : 'Manage your farm and products from here.'}
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" color="green" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Total Products',   value: stats?.total,      icon: '📦', color: 'bg-blue-50 text-blue-700' },
              { label: 'Available',        value: stats?.available,  icon: '✅', color: 'bg-green-50 text-green-700' },
              { label: 'Out of Stock',     value: stats?.outOfStock, icon: '⚠️', color: 'bg-red-50 text-red-700' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className={`w-10 h-10 rounded-lg ${s.color}
                                 flex items-center justify-center text-xl mb-3`}>
                  {s.icon}
                </div>
                <p className="text-3xl font-bold text-farm-dark">{s.value ?? 0}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-semibold text-farm-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`card p-5 flex items-center gap-4
                          hover:shadow-md transition-shadow group
                          ${link.highlight ? 'border-purple-200 bg-purple-50/30' : ''}`}>
              <div className="text-3xl shrink-0">{link.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm
                                 group-hover:text-primary-600 transition-colors
                                 ${link.highlight ? 'text-purple-700' : 'text-farm-dark'}`}>
                    {link.label}
                  </p>
                  {link.badge !== null && link.badge > 0 && (
                    <span className="badge badge-green">{link.badge}</span>
                  )}
                  {link.highlight && (
                    <span className="text-xs bg-purple-100 text-purple-600
                                     px-1.5 py-0.5 rounded-full font-medium">
                      AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <span className={`text-xl transition-colors
                               ${link.highlight
                                 ? 'text-purple-300 group-hover:text-purple-500'
                                 : 'text-gray-300 group-hover:text-primary-400'}`}>
                →
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* AI Chat Widget — visible on all farmer pages */}
      <ChatWidget />
    </div>
  )
}
