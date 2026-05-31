import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminPrivateRoute, AdminPublicRoute } from './AdminRoutes'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ClientLayout } from '@/layouts/ClientLayout'

/* ── Spinner minimal utilisé pendant le lazy-loading ─────────────── */
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function lazy_<T extends React.ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  const C = lazy(factory)
  return function LazyPage(props: React.ComponentPropsWithoutRef<T>) {
    return (
      <Suspense fallback={<PageLoader />}>
        <C {...(props as Record<string, unknown>)} />
      </Suspense>
    )
  }
}

/* ── Admin pages — chunk séparé ──────────────────────────────────── */
const LoginPage      = lazy_(() => import('@/features/admin/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage  = lazy_(() => import('@/features/admin/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminCategoriesPage = lazy_(() => import('@/features/admin/categories/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const AdminProductsPage   = lazy_(() => import('@/features/admin/products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const OrdersPage     = lazy_(() => import('@/features/admin/orders/OrdersPage').then(m => ({ default: m.OrdersPage })))
const ClientsPage    = lazy_(() => import('@/features/admin/clients/ClientsPage'))
const PromotionsPage = lazy_(() => import('@/features/admin/promotions/PromotionsPage'))
const PaymentsPage   = lazy_(() => import('@/features/admin/payments/PaymentsPage'))
const ShippingPage   = lazy_(() => import('@/features/admin/shipping/ShippingPage'))
const ReviewsPage    = lazy_(() => import('@/features/admin/reviews/ReviewsPage'))
const ReportsPage    = lazy_(() => import('@/features/admin/reports/ReportsPage'))
const MessagesPage   = lazy_(() => import('@/features/admin/messages/MessagesPage'))
const SettingsPage   = lazy_(() => import('@/features/admin/settings/SettingsPage'))

/* ── Client pages ─────────────────────────────────────────────────── */
const HomePage            = lazy_(() => import('@/features/client/home/HomePage').then(m => ({ default: m.HomePage })))
const ClientCategoriesPage = lazy_(() => import('@/features/client/catalog/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const CategoryDetailPage  = lazy_(() => import('@/features/client/catalog/CategoryDetailPage').then(m => ({ default: m.CategoryDetailPage })))
const ProductDetailPage   = lazy_(() => import('@/features/client/catalog/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const SearchPage          = lazy_(() => import('@/features/client/search/SearchPage').then(m => ({ default: m.SearchPage })))
const CartPage            = lazy_(() => import('@/features/client/cart/CartPage').then(m => ({ default: m.CartPage })))
const WishlistPage        = lazy_(() => import('@/features/client/wishlist/WishlistPage').then(m => ({ default: m.WishlistPage })))
const AccountPage         = lazy_(() => import('@/features/client/account/AccountPage').then(m => ({ default: m.AccountPage })))
const CheckoutPage        = lazy_(() => import('@/features/client/checkout/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const CheckoutSuccessPage = lazy_(() => import('@/features/client/checkout/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })))

export const router = createBrowserRouter(
  [
    {
      path: '/admin',
      children: [
        {
          element: <AdminPublicRoute />,
          children: [
            { path: 'login', element: <LoginPage /> },
          ],
        },
        {
          element: <AdminPrivateRoute />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { path: 'dashboard',    element: <DashboardPage /> },
                { path: 'categories',   element: <AdminCategoriesPage /> },
                { path: 'produits',     element: <AdminProductsPage /> },
                { path: 'commandes',    element: <OrdersPage /> },
                { path: 'clients',      element: <ClientsPage /> },
                { path: 'paiements',    element: <PaymentsPage /> },
                { path: 'promotions',   element: <PromotionsPage /> },
                { path: 'livraison',    element: <ShippingPage /> },
                { path: 'avis-clients', element: <ReviewsPage /> },
                { path: 'messages',     element: <MessagesPage /> },
                { path: 'rapports',     element: <ReportsPage /> },
                { path: 'parametres',   element: <SettingsPage /> },
              ],
            },
          ],
        },
        { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      ],
    },

    // Client routes
    {
      element: <ClientLayout />,
      children: [
        { path: '/',                   element: <HomePage /> },
        { path: '/categories',         element: <ClientCategoriesPage /> },
        { path: '/categories/:slug',   element: <CategoryDetailPage /> },
        { path: '/produits/:slug',     element: <ProductDetailPage /> },
        { path: '/recherche',          element: <SearchPage /> },
        { path: '/panier',             element: <CartPage /> },
        { path: '/checkout',           element: <CheckoutPage /> },
        { path: '/checkout/success',   element: <CheckoutSuccessPage /> },
        { path: '/favoris',            element: <WishlistPage /> },
        { path: '/compte',             element: <AccountPage /> },
        { path: '/produits',           element: <Navigate to="/categories" replace /> },
        { path: '/profil',             element: <Navigate to="/compte" replace /> },
        { path: '/a-propos',           element: <Navigate to="/" replace /> },
        { path: '/promotions',         element: <Navigate to="/categories" replace /> },
      ],
    },

    { path: '*', element: <Navigate to="/" replace /> },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  },
)
