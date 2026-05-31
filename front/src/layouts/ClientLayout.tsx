import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { NToast } from '@/components/client/NToast'
import { NNavBar } from '@/components/client/NNavBar'
import { useShopStore } from '@/store/shopStore'
import { useClientAuthStore } from '@/store/clientAuthStore'

export function ClientLayout() {
  const loadConfig = useShopStore((s) => s.load)
  const fetchUser = useClientAuthStore((s) => s.fetchUser)

  useEffect(() => {
    loadConfig()
    fetchUser()
  }, [loadConfig, fetchUser])

  return (
    <div className="min-h-dvh bg-paper font-sans text-ink">
      <NNavBar />
      <main>
        <Outlet />
      </main>
      <NToast />
    </div>
  )
}
