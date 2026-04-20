import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { getMe }        from './api/authApi'
import { RequireAuth, RequireRole, RedirectIfAuth } from './components/RouteGuards'

import LoginPage       from './pages/auth/LoginPage'
import RegisterPage    from './pages/auth/RegisterPage'
import FarmerDashboard from './pages/dashboard/FarmerDashboard'
import BuyerDashboard  from './pages/dashboard/BuyerDashboard'
import AdminDashboard  from './pages/admin/AdminDashboard'
import ProductsManage  from './pages/farmer/ProductsManage'
import OrdersManage    from './pages/farmer/OrdersManage'
import FarmerInsights  from './pages/farmer/FarmerInsights'
import ProductCatalog  from './pages/buyer/ProductCatalog'
import CartPage        from './pages/buyer/CartPage'
import CheckoutPage    from './pages/buyer/CheckoutPage'
import BuyerOrders     from './pages/buyer/BuyerOrders'
import EditProfile     from './pages/profile/EditProfile'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 300000, refetchOnWindowFocus: false } }
})

function AuthInitialiser() {
  const { setAuth, setLoading } = useAuthStore()
  useEffect(() => {
    const restore = async () => {
      try {
        const user = await getMe()
        if (user) {
          const token = useAuthStore.getState().accessToken || 'session-restored'
          setAuth(user, token)
        } else { setLoading(false) }
      } catch { setLoading(false) }
    }
    restore()
  }, [])
  return null
}

function AppRoutes() {
  const isLoading = useAuthStore(s => s.isLoading)
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-6xl mb-4">🌾</div>
        <p className="text-2xl font-bold text-green-700 mb-3">FarmConnect</p>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent
                          rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }
  return (
    <Routes>
      {/* Public */}
      <Route element={<RedirectIfAuth />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Farmer */}
      <Route element={<RequireRole role="farmer" />}>
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer/products"  element={<ProductsManage />} />
        <Route path="/farmer/orders"    element={<OrdersManage />} />
        <Route path="/farmer/insights"  element={<FarmerInsights />} />
      </Route>

      {/* Buyer */}
      <Route element={<RequireRole role="buyer" />}>
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/products"  element={<ProductCatalog />} />
        <Route path="/buyer/cart"      element={<CartPage />} />
        <Route path="/buyer/checkout"  element={<CheckoutPage />} />
        <Route path="/buyer/orders"    element={<BuyerOrders />} />
      </Route>

      {/* Admin */}
      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Profile — any authenticated user */}
      <Route element={<RequireAuth />}>
        <Route path="/profile/edit" element={<EditProfile />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitialiser />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
