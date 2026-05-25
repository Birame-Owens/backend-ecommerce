import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/store/adminAuthStore'
import { adminAuthApi } from '@/api/admin/auth'

export function DashboardPage() {
  const { user, clearAuth } = useAdminAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await adminAuthApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-6">Bienvenue, {user?.name}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
