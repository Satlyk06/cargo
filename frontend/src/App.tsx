import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import ShipmentsPage from './pages/dashboard/ShipmentsPage'
import NotificationsPage from './pages/dashboard/NotificationsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCargo from './pages/admin/AdminCargo'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProfile from './pages/admin/AdminProfile'
import './i18n'

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  
  console.log('🌐 AppRoutes - isAuthenticated:', isAuthenticated)

  if (!isAuthenticated) {
    console.log('🔒 Kullanıcı oturumu yok, login\'e yönlendiriliyor...')
    return (
      <>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="shipments" element={<ShipmentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/admin-panel" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="cargo" element={<AdminCargo />} />
          <Route path="cargo/add" element={<AdminCargo />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

function App() {
  console.log('🚀 App başlatılıyor...')
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App