import { useState, useEffect } from 'react'
import { Users, Package, ClipboardList, UserCheck,
         UserX, TrendingUp, Search, Trash2, ShieldCheck } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { StatCard, Button, Alert, Spinner, ConfirmDialog, EmptyState } from '../../components/ui'
import { getAdminStats, getAdminUsers, toggleAdminUser, deleteAdminUser } from '../../api/adminApi'
import { getProducts } from '../../api/productsApi'
import api from '../../api/axios'

const TABS = [
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders',   label: 'Orders',   icon: ClipboardList },
]

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium
                      border-b-2 -mb-px transition-colors ${
            active === t.id
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <t.icon className="w-4 h-4" />
          {t.label}
        </button>
      ))}
    </div>
  )
}

function RoleBadge({ role }) {
  const map = {
    farmer: 'badge-green',
    buyer:  'badge-blue',
    admin:  'badge-purple',
  }
  return <span className={`badge ${map[role] || 'badge-gray'}`}>{role}</span>
}

function UsersTab() {
  const [users,      setUsers]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [role,       setRole]       = useState('')
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const flash = (msg, t='success') => {
    t === 'success' ? setSuccess(msg) : setError(msg)
    setTimeout(() => { setSuccess(''); setError('') }, 3000)
  }

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (role)   params.role   = role
    getAdminUsers(params)
      .then(data => { setUsers(data.results); setTotal(data.count) })
      .catch(() => flash('Failed to load.', 'error'))
      .finally(() => setLoading(false))
  }, [search, role])

  const handleToggle = async id => {
    try {
      const res = await toggleAdminUser(id)
      setUsers(p => p.map(u => u.id === id ? { ...u, is_active: res.is_active } : u))
      flash(res.message)
    } catch { flash('Failed.', 'error') }
  }

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await deleteAdminUser(confirmDel.id)
      setUsers(p => p.filter(u => u.id !== confirmDel.id))
      setTotal(p => p - 1); setConfirmDel(null); flash('User deleted.')
    } catch { flash('Failed to delete.', 'error') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

      <div className="flex gap-3 flex-wrap mb-5 items-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search name or email…"
            className="input pl-10 w-56 text-sm" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-32 text-sm" value={role}
          onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="farmer">Farmer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {total} user{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Name', 'Email', 'Role', 'Details', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500
                                      to-primary-700 flex items-center justify-center
                                      text-white text-xs font-bold shrink-0">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.email}</td>
                  <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{u.farm_name || u.profile_phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggle(u.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold ${
                          u.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setConfirmDel(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600
                                   hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete User?"
        message={`Permanently delete "${confirmDel?.full_name}"? This cannot be undone.`}
        confirmLabel="Delete" variant="danger" />
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => {
    setLoading(true)
    getProducts({ ordering: '-created_at', ...(search ? { search } : {}) })
      .then(data => setProducts(data.results || []))
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false))
  }, [search])

  const handleRemove = async id => {
    if (!window.confirm('Remove this product?')) return
    try {
      await api.delete(`/products/my-listings/${id}/`)
      setProducts(p => p.filter(x => x.id !== id))
      setSuccess('Product removed.')
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Failed to remove.') }
  }

  return (
    <div>
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}

      <div className="flex gap-3 mb-5 items-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search products…"
            className="input pl-10 w-56 text-sm" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-sm text-gray-500 ml-auto">{products.length} products</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Product', 'Farmer', 'Category', 'Price', 'Stock', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">{p.category_icon || '🌾'}</div>
                        }
                      </div>
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.farm_name || p.farmer_name}</td>
                  <td className="px-5 py-3 text-gray-500">{p.category_icon} {p.category_name}</td>
                  <td className="px-5 py-3 font-semibold">UGX {Number(p.price).toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-500">{p.quantity} {p.unit}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${p.is_available ? 'badge-green' : 'badge-red'}`}>
                      {p.is_available ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleRemove(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600
                                 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrdersTab() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/orders/all/', { params: filter ? { status: filter } : {} })
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [filter])

  const STATUS_BADGE = {
    pending: 'badge-yellow', confirmed: 'badge-blue', packed: 'badge-purple',
    dispatched: 'badge-orange', delivered: 'badge-green', cancelled: 'badge-red',
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <div>
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="flex gap-2 flex-wrap mb-5">
        {['', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize
                        transition-colors ${
              filter === s
                ? 'bg-farm-dark text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s || 'All'} ({(s ? orders.filter(o => o.status === s) : orders).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders found" description="Try a different filter." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Order', 'Buyer', 'Farmer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="table-row">
                  <td className="px-5 py-4 font-semibold text-gray-900">#{o.id}</td>
                  <td className="px-5 py-4 text-gray-600">{o.buyer_name}</td>
                  <td className="px-5 py-4 text-gray-600">{o.farm_name || o.farmer_name}</td>
                  <td className="px-5 py-4 font-semibold">UGX {Number(o.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize ${STATUS_BADGE[o.status] || 'badge-gray'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('users')

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="Platform Dashboard" subtitle="Manage FarmConnect">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total Users"    value={stats?.total_users}    icon={Users}      color="text-blue-600"    bg="bg-blue-50" />
          <StatCard label="Farmers"        value={stats?.total_farmers}  icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Buyers"         value={stats?.total_buyers}   icon={Users}      color="text-purple-600"  bg="bg-purple-50" />
          <StatCard label="Active"         value={stats?.active_users}   icon={UserCheck}  color="text-teal-600"    bg="bg-teal-50" />
          <StatCard label="Inactive"       value={stats?.inactive_users} icon={UserX}      color="text-red-600"     bg="bg-red-50" />
          <StatCard label="New This Week"  value={stats?.new_this_week}  icon={TrendingUp} color="text-amber-600"   bg="bg-amber-50" />
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
      {tab === 'users'    && <UsersTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'orders'   && <OrdersTab />}
    </AppLayout>
  )
}
