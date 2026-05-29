import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/client/BottomNav'
import { ClientFooter } from '@/components/client/ClientFooter'
import { ClientHeader } from '@/components/client/ClientHeader'

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-beige-100">
      <ClientHeader />
      <main className="pb-24 md:pb-12">
        <Outlet />
      </main>
      <ClientFooter />
      <BottomNav />
    </div>
  )
}
