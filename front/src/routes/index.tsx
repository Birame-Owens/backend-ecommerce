import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/admin/auth/LoginPage'
import { DashboardPage } from '@/features/admin/dashboard/DashboardPage'
import { CategoriesPage } from '@/features/admin/categories/CategoriesPage'
import { AdminPrivateRoute, AdminPublicRoute } from './AdminRoutes'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ClientLayout } from '@/layouts/ClientLayout'
import { ComingSoonPage } from '@/features/admin/ComingSoonPage'
import { ProductsPage } from '@/features/admin/products/ProductsPage'
import { HomePage } from '@/features/client/home/HomePage'

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
                { path: 'commandes',   element: <ComingSoonPage title="Commandes" /> },
                { path: 'clients',     element: <ComingSoonPage title="Clients" /> },
                { path: 'paiements',   element: <ComingSoonPage title="Paiements" /> },
                { path: 'promotions',  element: <ComingSoonPage title="Promotions" /> },
                { path: 'livraison',   element: <ComingSoonPage title="Livraison" /> },
                { path: 'avis-clients',element: <ComingSoonPage title="Avis Clients" /> },
                { path: 'messages',    element: <ComingSoonPage title="Messages" /> },
                { path: 'rapports',    element: <ComingSoonPage title="Rapports" /> },
                { path: 'parametres',  element: <ComingSoonPage title="Paramètres" /> },
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
        { path: '/categories', element: <ComingSoonPage title="Catégories" /> },
        { path: '/categories/:slug', element: <ComingSoonPage title="Catégorie" /> },
        { path: '/produits', element: <ComingSoonPage title="Produits" /> },
        { path: '/produits/:slug', element: <ComingSoonPage title="Produit" /> },
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
