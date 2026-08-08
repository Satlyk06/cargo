import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// API URL - can be overridden with EXPO_PUBLIC_API_URL environment variable
// For physical device testing, use your computer's LAN IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.61.74.52:3001/api'

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