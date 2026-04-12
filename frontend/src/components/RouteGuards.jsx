import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function RequireAuth() {
  const { accessToken, isLoading } = useAuthStore()
  const location = useLocation()
  if (isLoading) return null
  if (!accessToken) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

export function RequireRole({ role }) {
  const { accessToken, user, isLoading } = useAuthStore()
  const location = useLocation()
  if (isLoading) return null
  if (!accessToken) return <Navigate to="/login" state={{ from: location }} replace />
  if (user?.role !== role) {
    const redirect = user?.role === 'farmer' ? '/farmer/dashboard'
                   : user?.role === 'admin'  ? '/admin/dashboard'
                   : '/buyer/dashboard'
    return <Navigate to={redirect} replace />
  }
  return <Outlet />
}

export function RedirectIfAuth() {
  const { accessToken, user, isLoading } = useAuthStore()
  if (isLoading) return null
  if (accessToken && user) {
    const redirect = user.role === 'farmer' ? '/farmer/dashboard'
                   : user.role === 'admin'  ? '/admin/dashboard'
                   : '/buyer/dashboard'
    return <Navigate to={redirect} replace />
  }
  return <Outlet />
}
