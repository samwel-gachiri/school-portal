import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthState } from '@/types'
import { authApi } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.username || '')

  // Actions
  const login = async (username: string, password: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      console.log('Attempting login with:', { username, password: password ? '[HIDDEN]' : 'NOT SET' })
      
      const response = await authApi.login(username, password)
      
      console.log('Login response:', response)
      
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        
        // Store token in localStorage
        localStorage.setItem('auth_token', response.data.token)
        
        console.log('Login successful, user:', user.value)
        return true
      } else {
        error.value = response.error?.message || 'Login failed'
        console.error('Login failed:', response.error)
        return false
      }
    } catch (err) {
      console.error('Login exception:', err)
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear state regardless of API call success
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')
      isLoading.value = false
    }
  }

  const verifyToken = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    isLoading.value = true
    
    try {
      const response = await authApi.verify()
      
      if (response.success && response.data) {
        user.value = response.data.user
        return true
      } else {
        // Token is invalid, clear it
        await logout()
        return false
      }
    } catch (err) {
      console.error('Token verification error:', err)
      await logout()
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const initializeAuth = async (): Promise<void> => {
    if (token.value) {
      await verifyToken()
    }
  }

  // Auto-logout on token expiration
  const setupTokenExpiration = () => {
    if (token.value) {
      try {
        const payload = JSON.parse(atob(token.value.split('.')[1]))
        const expirationTime = payload.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()
        const timeUntilExpiration = expirationTime - currentTime

        if (timeUntilExpiration > 0) {
          setTimeout(() => {
            logout()
          }, timeUntilExpiration)
        } else {
          // Token already expired
          logout()
        }
      } catch (err) {
        console.error('Error parsing token:', err)
        logout()
      }
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    userName,
    
    // Actions
    login,
    logout,
    verifyToken,
    clearError,
    initializeAuth,
    setupTokenExpiration
  }
})