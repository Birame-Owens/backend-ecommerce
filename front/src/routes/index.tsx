import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/admin/auth/LoginPage'
import { DashboardPage } from '@/features/admin/dashboard/DashboardPage'
import { CategoriesPage } from '@/features/admin/categories/CategoriesPage'
import { AdminPrivateRoute, AdminPublicRoute } from './AdminRoutes'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ClientLayout } from '@/layouts/ClientLayout'
import { ComingSoonPage } from '@/features/admin/ComingSoonPage'
import { ProductsPage } from '@/features/admin/products/ProductsPage'
import { OrdersPage } from '@/features/admin/orders/OrdersPage'
import ClientsPage from '@/features/admin/clients/ClientsPage'
import PromotionsPage from '@/features/admin/promotions/PromotionsPage'
import PaymentsPage from '@/features/admin/payments/PaymentsPage'
import ShippingPage from '@/features/admin/shipping/ShippingPage'
import ReviewsPage from '@/features/admin/reviews/ReviewsPage'
import ReportsPage from '@/features/admin/reports/ReportsPage'
import MessagesPage from '@/features/admin/messages/MessagesPage'
import SettingsPage from '@/features/admin/settings/SettingsPage'
import { HomePage } from '@/features/client/home/HomePage'
import { CategoriesPage as ClientCategoriesPage } from '@/features/client/catalog/CategoriesPage'
import { CategoryDetailPage as ClientCategoryDetailPage } from '@/features/client/catalog/CategoryDetailPage'
import { ProductDetailPage as ClientProductDetailPage } from '@/features/client/catalog/ProductDetailPage'
import { ProductsPage as ClientProductsPage } from '@/features/client/catalog/ProductsPage'

export const router = createBrowserRouter(
  [
    {
      path: '/admin',
      children: [
        // Routes publiques (login)
        {
          element: <AdminPublicRoute />,
          children: [
            { path: 'login', element: <LoginPage /> },
          ],
        },

        // Routes protégées (avec sidebar)
        {
          element: <AdminPrivateRoute />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { path: 'dashboard',   element: <DashboardPage /> },
                { path: 'categories',  element: <CategoriesPage /> },
                { path: 'produits',    element: <ProductsPage /> },
                { path: 'commandes',   element: <OrdersPage /> },
                { path: 'clients',     element: <ClientsPage /> },
                { path: 'paiements',   element: <PaymentsPage /> },
                { path: 'promotions',  element: <PromotionsPage /> },
                { path: 'livraison',   element: <ShippingPage /> },
                { path: 'avis-clients',element: <ReviewsPage /> },
                { path: 'messages',    element: <MessagesPage /> },
                { path: 'rapports',    element: <ReportsPage /> },
                { path: 'parametres',  element: <SettingsPage /> },
              ],
            },
          ],
        },

        // /admin → /admin/dashboard
        { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      ],
    },

    // Routes client publiques
    {
      element: <ClientLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/categories', element: <ClientCategoriesPage /> },
        { path: '/categories/:slug', element: <ClientCategoryDetailPage /> },
        { path: '/produits', element: <ClientProductsPage /> },
        { path: '/produits/:slug', element: <ClientProductDetailPage /> },
        { path: '/promotions', element: <ComingSoonPage title="Promotions" /> },
        { path: '/favoris', element: <ComingSoonPage title="Favoris" /> },
        { path: '/panier', element: <ComingSoonPage title="Panier" /> },
        { path: '/profil', element: <ComingSoonPage title="Profil" /> },
        { path: '/a-propos', element: <ComingSoonPage title="À propos" /> },
      ],
    },

    // Tout autre chemin → accueil
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  },
)
