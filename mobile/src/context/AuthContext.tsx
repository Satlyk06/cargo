import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  isLoading: boolean
  login: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStoredData()
  }, [])

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token')
      const storedUser = await AsyncStorage.getItem('user')
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem('token', newToken)
      await AsyncStorage.setItem('user', JSON.stringify(newUser))
      setToken(newToken)
      setUser(newUser)
    } catch (error) {
      console.error('Login hatası:', error)
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token')
      await AsyncStorage.removeItem('user')
      setToken(null)
      setUser(null)
    } catch (error) {
      console.error('Logout hatası:', error)
    }
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}