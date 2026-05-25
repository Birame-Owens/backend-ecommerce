import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/admin/Sidebar'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
