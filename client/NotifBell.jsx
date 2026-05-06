import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotifBell() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { unreadCount } = useNotifications(user?.role)

  if (user?.role !== 'parent') return null

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      title="Notifications"
    >
      <Bell size={20} className="text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500
          rounded-full flex items-center justify-center text-white text-xs font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}