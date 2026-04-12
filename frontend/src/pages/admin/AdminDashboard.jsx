import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAdminStats, getAdminUsers, toggleAdminUser, deleteAdminUser } from '../../api/adminApi'
import { Button, Logo, Alert, Spinner } from '../../components/ui'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="card p-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-farm-dark">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    farmer: 'bg-green-100 text-green-800',
    buyer:  'bg-blue-100 text-blue-800',
    admin:  'bg-purple-100 text-purple-800',
  }
  return (
    <span className={`badge ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth()

  const [stats,      setStats]      = useState(null)
  const [users,      setUsers]      = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [usersLoading,setUsersLoading]=useState(true)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Load stats
  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false))
  }, [])

  // Load users (re-runs when search or role filter changes)
  useEffect(() => {
    setUsersLoading(true)
    const params = {}
    if (search)     params.search = search
    if (roleFilter) params.role   = roleFilter

    getAdminUsers(params)
      .then(data => { setUsers(data.results); setTotalUsers(data.count) })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setUsersLoading(false))
  }, [search, roleFilter])

  const handleToggle = async (userId) => {
    try {
      const res = await toggleAdminUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: res.is_active } : u))
      setSuccess(res.message)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to update user.')
    }
  }

  const handleDelete = async (userId) => {
    try {
      await deleteAdminUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setTotalUsers(prev => prev - 1)
      setConfirmDelete(null)
      setSuccess('User deleted successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete user.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-farm-dark text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌾</span>
          <div>
            <p className="font-bold text-lg">FarmConnect</p>
            <p className="text-xs text-green-300">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-green-300">Administrator</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">Platform Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users and monitor platform activity</p>
        </div>

        {/* Alerts */}
        {error   && <div className="mb-4"><Alert type="error"   message={error}   /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" color="green" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <StatCard label="Total Users"    value={stats?.total_users}    icon="👥" color="bg-blue-50 text-blue-600" />
            <StatCard label="Farmers"        value={stats?.total_farmers}  icon="🌾" color="bg-green-50 text-green-600" />
            <StatCard label="Buyers"         value={stats?.total_buyers}   icon="🛒" color="bg-purple-50 text-purple-600" />
            <StatCard label="Active"         value={stats?.active_users}   icon="✅" color="bg-emerald-50 text-emerald-600" />
            <StatCard label="Inactive"       value={stats?.inactive_users} icon="⛔" color="bg-red-50 text-red-600" />
            <StatCard label="New This Week"  value={stats?.new_this_week}  icon="🆕" color="bg-yellow-50 text-yellow-600" />
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          {/* Table Header */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-farm-dark">All Users</h2>
              <p className="text-xs text-gray-500">{totalUsers} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Search */}
              <input
                type="text"
                placeholder="Search name or email..."
                className="input w-48 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {/* Role filter */}
              <select
                className="input w-36 text-sm"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {usersLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" color="green" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">👤</p>
              <p className="font-medium">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Role</th>
                    <th className="text-left px-5 py-3">Farm / Phone</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Joined</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center
                                          justify-center text-primary-700 text-xs font-bold shrink-0">
                            {u.full_name?.charAt(0) || '?'}
                          </div>
                          {u.full_name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{u.email}</td>
                      <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-4 text-gray-500">
                        {u.farm_name || u.profile_phone || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(u.id)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              u.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium
                                       bg-gray-100 text-gray-600 hover:bg-red-50
                                       hover:text-red-600 transition-colors"
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
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg text-farm-dark">Delete User?</h3>
              <p className="text-gray-500 text-sm mt-2">
                This will permanently delete <strong>{confirmDelete.full_name}</strong>.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" fullWidth onClick={() => handleDelete(confirmDelete.id)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
