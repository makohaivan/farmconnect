import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button, Logo, Spinner } from '../../components/ui'
import { getMyListings } from '../../api/productsApi'

export default function FarmerDashboard() {
  const { user, logout } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real data every time the dashboard loads
    getMyListings()
      .then(data => {
        const products  = data.results || []
        const available = products.filter(p => p.is_available).length
        const outOfStock= products.filter(p => p.quantity === 0).length

        setStats({
          total:      products.length,
          available,
          outOfStock,
        })
      })
      .catch(() => setStats({ total: 0, available: 0, outOfStock: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    {
      to:   '/farmer/products',
      icon: '📦',
      label:'My Products',
      desc: 'Add, edit and manage your listings',
      badge: stats?.total ?? null,
    },
    {
      to:   '/farmer/orders',
      icon: '📋',
      label:'Orders',
      desc: 'View and fulfil incoming orders',
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 fade-in">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">
            Welcome, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.farmerprofile?.farm_name
              ? `${user.farmerprofile.farm_name} — ${user.farmerprofile.location || ''}`
              : 'Manage your farm and products from here.'}
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" color="green" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700
                              flex items-center justify-center text-xl mb-3">
                📦
              </div>
              <p className="text-3xl font-bold text-farm-dark">{stats?.total ?? 0}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Products</p>
            </div>

            <div className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700
                              flex items-center justify-center text-xl mb-3">
                ✅
              </div>
              <p className="text-3xl font-bold text-farm-dark">{stats?.available ?? 0}</p>
              <p className="text-sm text-gray-500 mt-0.5">Available for Sale</p>
            </div>

            <div className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700
                              flex items-center justify-center text-xl mb-3">
                ⚠️
              </div>
              <p className="text-3xl font-bold text-farm-dark">{stats?.outOfStock ?? 0}</p>
              <p className="text-sm text-gray-500 mt-0.5">Out of Stock</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="font-semibold text-farm-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-5 flex items-center gap-4
                         hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl">{link.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-farm-dark
                                group-hover:text-primary-600 transition-colors">
                    {link.label}
                  </p>
                  {link.badge !== null && (
                    <span className="badge badge-green">{link.badge}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{link.desc}</p>
              </div>
              <span className="text-gray-300 group-hover:text-primary-400
                               text-xl transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
