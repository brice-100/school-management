import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop — fixe, toujours visible */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar mobile — glisse depuis la gauche */}
      <div className={`
        fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out
        lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenu principal */}
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">

        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center justify-between
          px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">É</span>
            </div>
            <span className="font-display font-semibold text-primary-500 text-sm">
              ÉcoleManager
            </span>
          </div>
          <div className="w-9" /> {/* espace pour centrer le logo */}
        </div>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}