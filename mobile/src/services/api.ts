import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// API URL can be overridden with EXPO_PUBLIC_API_URL.  Do not use a machine
// specific LAN address as the fallback: a release build (or another device)
// would then silently talk to a different, often empty, backend.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cargo-qujk.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Her istekte token'ı ekle
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
