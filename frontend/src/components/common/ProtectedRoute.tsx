import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  // Sadece bir kere log at - sonsuz döngüyü önle
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}