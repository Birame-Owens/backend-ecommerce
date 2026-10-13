import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NToast } from '@/components/client/NToast'
import { NNavBar } from '@/components/client/NNavBar'
import { AnnouncementBar } from '@/components/client/AnnouncementBar'
import { useShopStore } from '@/store/shopStore'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { initGA, initMetaPixel, trackPageview } from '@/lib/analytics'

export function ClientLayout() {
  const loadConfig = useShopStore((s) => s.load)
  const fetchUser = useClientAuthStore((s) => s.fetchUser)
  const logo = useShopStore((s) => s.logo)
  const gaId = useShopStore((s) => s.gaId)
  const metaPixelId = useShopStore((s) => s.metaPixelId)
  const location = useLocation()

  useEffect(() => {
    loadConfig()
    fetchUser()
  }, [loadConfig, fetchUser])

  useEffect(() => {
    if (gaId) initGA(gaId)
  }, [gaId])

  useEffect(() => {
    if (metaPixelId) initMetaPixel(metaPixelId)
  }, [metaPixelId])

  // Une page vue par navigation React Router (GA et Meta ne les voient pas seuls en SPA).
  useEffect(() => {
    if (gaId || metaPixelId) trackPageview(location.pathname + location.search)
  }, [gaId, metaPixelId, location.pathname, location.search])

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
      <AnnouncementBar />
      <NNavBar />
      <main>
        <Outlet />
      </main>
      <NToast />
    </div>
  )
}
