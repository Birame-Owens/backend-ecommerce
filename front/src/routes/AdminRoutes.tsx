import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuthStore } from '@/store/adminAuthStore'

export function AdminPrivateRoute() {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export function AdminPublicRoute() {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Outlet />
}
