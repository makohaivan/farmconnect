/**
 * FarmConnect — Admin Dashboard
 * Platform stats, user management, product moderation, order overview.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getAdminStats, getAdminUsers, toggleAdminUser, deleteAdminUser } from '../../api/adminApi'
import { getProducts } from '../../api/productsApi'
import { Button, Logo, Alert, Spinner } from '../../components/ui'
import api from '../../api/axios'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card p-5">
      <div className={`w-12 h-12 rounded-xl flex items-center
                       justify-center text-2xl mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-farm-dark">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function RoleBadge({ role }) {
  const styles = {
    farmer: 'bg-green-100 text-green-800',
    buyer:  'bg-blue-100 text-blue-800',
    admin:  'bg-purple-100 text-purple-800',
  }
  return (
    <span className={`badge ${styles[role] || 'badge-gray'}`}>{role}</span>
  )
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,       setUsers]       = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('')
  const [success,     setSuccess]     = useState('')
  const [error,       setError]       = useState('')
  const [confirmDel,  setConfirmDel]  = useState(null)

  const flash = (msg, type='success') => {
    if (type === 'success') setSuccess(msg)
    else setError(msg)
    setTimeout(() => { setSuccess(''); setError('') }, 3000)
  }

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (search)    params.search = search
    if (roleFilter)params.role   = roleFilter

    getAdminUsers(params)
      .then(data => { setUsers(data.results); setTotal(data.count) })
      .catch(() => flash('Failed to load users.', 'error'))
      .finally(() => setLoading(false))
  }, [search, roleFilter])

  const handleToggle = async (userId) => {
    try {
      const res = await toggleAdminUser(userId)
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: res.is_active } : u
      ))
      flash(res.message)
    } catch { flash('Failed to update user.', 'error') }
  }

  const handleDelete = async (userId) => {
    try {
      await deleteAdminUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setTotal(prev => prev - 1)
      setConfirmDel(null)
      flash('User deleted.')
    } catch { flash('Failed to delete user.', 'error') }
  }

  return (
    <div>
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5">
        <input type="text" placeholder="Search name or email..."
          className="input w-52 text-sm" value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="input w-36 text-sm" value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="farmer">Farmer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>
        <span className="text-sm text-gray-500 self-center">
          {total} user{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="green" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Details</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Joined</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100
                                        flex items-center justify-center
                                        text-primary-700 text-xs font-bold shrink-0">
                          {u.full_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-gray-800">
                          {u.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{u.email}</td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {u.farm_name || u.profile_phone || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${
                        u.is_active ? 'badge-green' : 'badge-red'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(u.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                            u.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setConfirmDel(u)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium
                                     bg-gray-100 text-gray-600 hover:bg-red-50
                                     hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg text-farm-dark">Delete User?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Permanently delete <strong>{confirmDel.full_name}</strong>?
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth
                onClick={() => setConfirmDel(null)}>Cancel</Button>
              <Button variant="danger" fullWidth
                onClick={() => handleDelete(confirmDel.id)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Products ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => {
    setLoading(true)
    const params = { ordering: '-created_at' }
    if (search) params.search = search
    getProducts(params)
      .then(data => setProducts(data.results || []))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false))
  }, [search])

  const handleRemove = async (productId) => {
    if (!window.confirm('Remove this product from the platform?')) return
    try {
      await api.delete(`/products/my-listings/${productId}/`)
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSuccess('Product removed.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to remove product.')
    }
  }

  return (
    <div>
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Search products..."
          className="input w-64 text-sm" value={search}
          onChange={e => setSearch(e.target.value)} />
        <span className="text-sm text-gray-500 self-center">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="green" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Farmer</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100
                                        overflow-hidden shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name}
                              className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center
                                            justify-center text-lg">
                              {p.category_icon || '🌾'}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.farm_name || p.farmer_name}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.category_icon} {p.category_name}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      UGX {Number(p.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${
                        p.is_available ? 'badge-green' : 'badge-red'
                      }`}>
                        {p.is_available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium
                                   bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Orders ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filter) params.status = filter

    // Admin fetches all orders via a special endpoint
    api.get('/orders/all/', { params })
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [filter])

  const STATUS_STYLES = {
    pending:    'bg-yellow-100 text-yellow-800',
    confirmed:  'bg-blue-100 text-blue-800',
    packed:     'bg-purple-100 text-purple-800',
    dispatched: 'bg-orange-100 text-orange-800',
    delivered:  'bg-green-100 text-green-800',
    cancelled:  'bg-red-100 text-red-800',
  }

  return (
    <div>
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="flex gap-2 flex-wrap mb-5">
        {['', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-farm-dark text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s || 'All Orders'} ({s ? orders.filter(o => o.status === s).length : orders.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" color="green" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Buyer</th>
                  <th className="text-left px-5 py-3">Farmer</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      #{o.id}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{o.buyer_name}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {o.farm_name || o.farmer_name}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      UGX {Number(o.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${STATUS_STYLES[o.status] || 'badge-gray'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('users')

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'users',    label: '👥 Users' },
    { id: 'products', label: '📦 Products' },
    { id: 'orders',   label: '📋 Orders' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-farm-dark text-white px-6 py-4
                         flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌾</span>
          <div>
            <p className="font-bold text-lg">FarmConnect</p>
            <p className="text-xs text-green-300">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/profile/edit"
            className="text-xs text-green-300 hover:text-white">
            {user?.first_name} {user?.last_name}
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">Platform Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage users, products, and orders across FarmConnect
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" color="green" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6
                          gap-4 mb-10">
            <StatCard label="Total Users"   value={stats?.total_users}    icon="👥" color="bg-blue-50 text-blue-600" />
            <StatCard label="Farmers"       value={stats?.total_farmers}  icon="🌾" color="bg-green-50 text-green-600" />
            <StatCard label="Buyers"        value={stats?.total_buyers}   icon="🛒" color="bg-purple-50 text-purple-600" />
            <StatCard label="Active"        value={stats?.active_users}   icon="✅" color="bg-emerald-50 text-emerald-600" />
            <StatCard label="Inactive"      value={stats?.inactive_users} icon="⛔" color="bg-red-50 text-red-600" />
            <StatCard label="New This Week" value={stats?.new_this_week}  icon="🆕" color="bg-yellow-50 text-yellow-600" />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors
                          border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'users'    && <UsersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders'   && <OrdersTab />}
      </main>
    </div>
  )
}
