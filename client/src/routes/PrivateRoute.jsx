import { Navigate } from 'react-router-dom'
import { useAuth }   from '../context/AuthContext'

// Spinner de chargement
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  )
}

// Route protégée — n'importe quel utilisateur connecté
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}

// Route protégée par rôle unique
export function RoleRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)              return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/unauthorized" replace />
  return children
}

// Route protégée par rôles multiples — ex: roles={['admin','teacher']}
export function RolesRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)                   return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}