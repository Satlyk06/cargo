import { createContext, useState, useContext, useEffect, type ReactNode } from 'react'

interface User {
  id: string
  phoneNumber: string
  name: string
  role: string
  isBanned: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    console.log('🔍 AuthProvider başlatılıyor...')
    console.log('  - storedToken:', storedToken ? '✅ Var' : '❌ Yok')
    console.log('  - storedUser:', storedUser ? '✅ Var' : '❌ Yok')

    if (storedToken && storedUser) {
      try {
        const tokenParts = storedToken.split('.')
        if (tokenParts.length !== 3) {
          console.log('❌ Token formatı geçersiz')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
          setIsLoading(false)
          return
        }
        
        const payload = JSON.parse(atob(tokenParts[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        
        console.log('📋 TOKEN KONTROLÜ:')
        console.log('  - Oluşturulma:', new Date(payload.iat * 1000).toLocaleString())
        console.log('  - Bitiş:', new Date(payload.exp * 1000).toLocaleString())
        console.log('  - Şu an:', new Date(currentTime * 1000).toLocaleString())
        
        // Token süresi dolmuş mu? (5 dakika tolerans ekleyelim)
        const tolerance = 300 // 5 dakika
        if (payload.exp && payload.exp < (currentTime - tolerance)) {
          console.log('⏰ TOKEN SÜRESİ DOLMUŞ! Logout yapılıyor...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        } else {
          const remaining = payload.exp - currentTime
          const days = Math.floor(remaining / 86400)
          console.log(`✅ Token geçerli, kalan süre: ${days} gün`)
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('❌ Token kontrol hatası:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
      }
    } else {
      console.log('ℹ️ Local storage\'da token veya user yok')
    }

    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    console.log('🔐 Login yapılıyor...')
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    console.log('✅ Token ve user localStorage\'a kaydedildi')
  }

  const logout = () => {
    console.log('🚪 Logout yapılıyor...')
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    console.log('✅ Token ve user localStorage\'dan temizlendi')
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  console.log('📊 Auth durumu:', { 
    isAuthenticated, 
    isAdmin, 
    user: user?.phoneNumber,
    tokenVarMi: !!token 
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}