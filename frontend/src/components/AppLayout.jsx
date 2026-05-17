/**
 * FarmConnect — App Layout
 * Shared sidebar + header layout for all authenticated pages.
 * Farmer, Buyer, and Admin each get role-specific nav items.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList,
  BarChart3, Users, Settings, LogOut, Menu, X, Bell,
  Sparkles, Store, UserCircle, ChevronRight, Leaf,
  ShieldCheck, TrendingUp, Home
} from 'lucide-react'
import { useAuth }      from '../hooks/useAuth'
import { useCartStore, cartItemCount } from '../store/cartStore'
import { Logo }         from './ui'
import ChatWidget           from './ChatWidget'
import NotificationBell     from './NotificationBell'

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, badge, end = false }) {
  const location = useLocation()
  const active   = end
    ? location.pathname === to
    : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={active ? 'sidebar-item-active' : 'sidebar-item'}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      {badge > 0 && (
        <span className="ml-auto w-5 h-5 bg-primary-600 text-white text-xs
                         rounded-full flex items-center justify-center font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

// ── Nav groups per role ───────────────────────────────────────────────────────
function FarmerNav() {
  return (
    <>
      <div className="mb-2">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase
                      tracking-wider mb-3">
          Farm Management
        </p>
      </div>
      <NavItem to="/farmer/dashboard" icon={LayoutDashboard} label="Dashboard" end />
      <NavItem to="/farmer/products"  icon={Package}         label="My Products" />
      <NavItem to="/farmer/orders"    icon={ClipboardList}   label="Orders" />
      <div className="mt-6 mb-2">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase
                      tracking-wider mb-3">
          AI Tools
        </p>
      </div>
      <NavItem to="/farmer/insights"  icon={Sparkles}        label="AI Insights" />
    </>
  )
}

function BuyerNav({ cartCount }) {
  return (
    <>
      <div className="mb-2">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase
                      tracking-wider mb-3">
          Shopping
        </p>
      </div>
      <NavItem to="/buyer/dashboard" icon={LayoutDashboard} label="Dashboard"      end />
      <NavItem to="/buyer/products"  icon={Store}           label="Browse Products" />
      <NavItem to="/buyer/cart"      icon={ShoppingCart}    label="Cart"            badge={cartCount} />
      <NavItem to="/buyer/orders"    icon={ClipboardList}   label="My Orders" />
    </>
  )
}

function AdminNav() {
  return (
    <>
      <div className="mb-2">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase
                      tracking-wider mb-3">
          Platform Management
        </p>
      </div>
      <NavItem to="/admin/dashboard" icon={ShieldCheck}    label="Dashboard" end />
    </>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, subtitle }) {
  const { user, logout }   = useAuth()
  const cartCount          = useCartStore(cartItemCount)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate           = useNavigate()
  const isFarmer           = user?.role === 'farmer'
  const isBuyer            = user?.role === 'buyer'
  const isAdmin            = user?.role === 'admin'

  const roleColor = isFarmer ? 'bg-emerald-100 text-emerald-700'
                  : isBuyer  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100
        flex flex-col z-40 shadow-xl transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
      `}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center
                         rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {isFarmer && <FarmerNav />}
          {isBuyer  && <BuyerNav cartCount={cartCount} />}
          {isAdmin  && <AdminNav />}

          {/* Common items */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <NavItem to="/profile/edit" icon={UserCircle} label="Edit Profile" />
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl
                          hover:bg-white hover:shadow-sm transition-all duration-150">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500
                            to-primary-700 flex items-center justify-center
                            text-white font-bold text-sm shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full
                               font-medium ${roleColor}`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-red-500 hover:bg-red-50
                         transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md
                           border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center
                         rounded-xl text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title */}
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-lg font-display font-bold text-gray-900
                               truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              {isBuyer && cartCount > 0 && (
                <Link to="/buyer/cart"
                  className="relative flex items-center gap-2 px-3 py-2
                             rounded-xl bg-primary-50 hover:bg-primary-100
                             text-primary-700 text-sm font-medium
                             transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="w-5 h-5 bg-primary-600 text-white text-xs
                                   rounded-full flex items-center justify-center
                                   font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  )
}
