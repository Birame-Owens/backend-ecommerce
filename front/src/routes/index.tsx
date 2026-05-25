import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/admin/auth/LoginPage'
import { AdminPrivateRoute, AdminPublicRoute } from './AdminRoutes'

export const router = createBrowserRouter([
  {
    path: '/admin',
    children: [
      // Routes publiques admin (non connecté seulement)
      {
        element: <AdminPublicRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
        ],
      },
      // Routes protégées admin
      {
        element: <AdminPrivateRoute />,
        children: [
          {
            path: 'dashboard',
            lazy: () => import('@/features/admin/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
        ],
      },
      // Redirect /admin → /admin/login
      { index: true, element: <LoginPage /> },
    ],
  },
  // Catch-all
  { path: '*', element: <LoginPage /> },
])
