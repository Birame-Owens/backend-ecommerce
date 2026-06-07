import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { NToast } from '@/components/client/NToast'
import { NNavBar } from '@/components/client/NNavBar'
import { useShopStore } from '@/store/shopStore'
import { useClientAuthStore } from '@/store/clientAuthStore'

export function ClientLayout() {
  const loadConfig = useShopStore((s) => s.load)
  const fetchUser = useClientAuthStore((s) => s.fetchUser)
  const logo = useShopStore((s) => s.logo)

  useEffect(() => {
    loadConfig()
    fetchUser()
  }, [loadConfig, fetchUser])

  // Favicon dynamique = logo de la boutique (rebranding sans toucher au code)
  useEffect(() => {
    if (!logo) return
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = logo
  }, [logo])

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
