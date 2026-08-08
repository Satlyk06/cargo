import { useEffect } from 'react'
import { Platform } from 'react-native'
// Attempt to require expo-navigation-bar at runtime. If it's not installed (e.g. web or dev env),
// provide a no-op fallback so TypeScript/ bundlers won't fail at runtime.
let NavigationBar: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  NavigationBar = require('expo-navigation-bar')
} catch {
  NavigationBar = {
    setVisibilityAsync: async () => {},
    setBackgroundColorAsync: async () => {},
  }
}

export const useHideNavigationBar = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden')
      NavigationBar.setBackgroundColorAsync('#f8fafc')
      
      return () => {
        NavigationBar.setVisibilityAsync('visible')
      }
    }
  }, [])
}