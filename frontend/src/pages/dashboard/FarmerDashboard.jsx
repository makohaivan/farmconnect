import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ClipboardList, Sparkles, TrendingUp,
         CheckCircle2, AlertTriangle, Plus } from 'lucide-react'
import AppLayout    from '../../components/AppLayout'
import { StatCard, Button, Spinner } from '../../components/ui'
import { getMyListings } from '../../api/productsApi'
import { useAuth } from '../../hooks/useAuth'

export default function FarmerDashboard() {
  const { user }          = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyListings()
      .then(data => {
        const products = data.results || []
        setStats({
          total:      products.length,
          available:  products.filter(p => p.is_available).length,
          outOfStock: products.filter(p => p.quantity === 0).length,
        })
      })
      .catch(() => setStats({ total: 0, available: 0, outOfStock: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout
      title={`Welcome back, ${user?.first_name}! 👋`}
      subtitle={user?.farmerprofile?.farm_name
        ? `${user.farmerprofile.farm_name} · ${user.farmerprofile.location || ''}`
        : 'Manage your farm from here'}
    >
      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Products"   value={stats?.total}
            icon={Package}       color="text-blue-600"    bg="bg-blue-50" />
          <StatCard label="Available"        value={stats?.available}
            icon={CheckCircle2}  color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Out of Stock"     value={stats?.outOfStock}
            icon={AlertTriangle} color="text-amber-600"   bg="bg-amber-50" />
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase
                     tracking-wider mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/farmer/products',  icon: Package,        label: 'My Products',
            desc: 'Add, edit and manage listings', color: 'bg-blue-50 text-blue-600',
            badge: stats?.total, action: 'Manage' },
          { to: '/farmer/orders',    icon: ClipboardList,  label: 'Orders',
            desc: 'View and fulfil incoming orders', color: 'bg-purple-50 text-purple-600',
            action: 'View Orders' },
          { to: '/farmer/insights',  icon: Sparkles,       label: 'AI Insights',
            desc: 'AI-powered sales analysis', color: 'bg-amber-50 text-amber-600',
            action: 'View Insights', ai: true },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card-hover p-5 group flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${item.color}
                               flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              {item.ai && (
                <span className="badge badge-yellow text-xs">AI</span>
              )}
              {item.badge > 0 && !item.ai && (
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
            <div className="flex items-center text-xs font-medium text-primary-600
                             group-hover:gap-2 transition-all">
              {item.action}
              <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Add product CTA if no products */}
      {!loading && stats?.total === 0 && (
        <div className="mt-6 card p-8 text-center border-2 border-dashed
                        border-gray-200">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            No products yet
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Add your first listing and start selling to buyers directly.
          </p>
          <Link to="/farmer/products">
            <Button icon={Plus}>Add Your First Product</Button>
          </Link>
        </div>
      )}
    </AppLayout>
  )
}
