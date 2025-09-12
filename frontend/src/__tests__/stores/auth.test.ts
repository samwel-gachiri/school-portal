import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the API
const mockAuthApi = {
  login: vi.fn(),
  logout: vi.fn(),
  verify: vi.fn(),
}

vi.mock('@/services/api', () => ({
  authApi: mockAuthApi,
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('initializes with correct default state', () => {
    const store = useAuthStore()

    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('loads token from localStorage on initialization', () => {
    localStorage.setItem('auth_token', 'stored-token')
    
    const store = useAuthStore()
    
    expect(store.token).toBe('stored-token')
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token',
          user: { user_id: 1, username: 'testuser' }
        }
      }

      mockAuthApi.login.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      const result = await store.login('testuser', 'password')

      expect(result).toBe(true)
      expect(store.token).toBe('jwt-token')
      expect(store.user).toEqual({ user_id: 1, username: 'testuser' })
      expect(store.isAuthenticated).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token')
    })

    it('handles login failure', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Invalid credentials' }
      }

      mockAuthApi.login.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      const result = await store.login('testuser', 'wrongpassword')

      expect(result).toBe(false)
      expect(store.error).toBe('Invalid credentials')
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })

    it('handles network errors', async () => {
      mockAuthApi.login.mockRejectedValue(new Error('Network error'))
      
      const store = useAuthStore()
      const result = await store.login('testuser', 'password')

      expect(result).toBe(false)
      expect(store.error).toBe('Network error')
    })

    it('sets loading state during login', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve
      })

      mockAuthApi.login.mockReturnValue(loginPromise)
      
      const store = useAuthStore()
      const loginCall = store.login('testuser', 'password')

      expect(store.isLoading).toBe(true)

      resolveLogin!({ success: true, data: { token: 'token', user: {} } })
      await loginCall

      expect(store.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('successfully logs out user', async () => {
      const store = useAuthStore()
      
      // Set initial state
      store.token = 'jwt-token'
      store.user = { user_id: 1, username: 'testuser' }

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('clears state even if API call fails', async () => {
      mockAuthApi.logout.mockRejectedValue(new Error('API error'))
      
      const store = useAuthStore()
      store.token = 'jwt-token'
      store.user = { user_id: 1, username: 'testuser' }

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })
  })

  describe('verifyToken', () => {
    it('successfully verifies valid token', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { user_id: 1, username: 'testuser' },
          valid: true
        }
      }

      mockAuthApi.verify.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      store.token = 'valid-token'
      
      const result = await store.verifyToken()

      expect(result).toBe(true)
      expect(store.user).toEqual({ user_id: 1, username: 'testuser' })
    })

    it('handles invalid token', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Invalid token' }
      }

      mockAuthApi.verify.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      store.token = 'invalid-token'
      
      const result = await store.verifyToken()

      expect(result).toBe(false)
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })

    it('returns false when no token exists', async () => {
      const store = useAuthStore()
      
      const result = await store.verifyToken()

      expect(result).toBe(false)
      expect(mockAuthApi.verify).not.toHaveBeenCalled()
    })
  })

  describe('computed properties', () => {
    it('calculates isAuthenticated correctly', () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)

      store.token = 'jwt-token'
      store.user = { user_id: 1, username: 'testuser' }

      expect(store.isAuthenticated).toBe(true)
    })

    it('calculates userName correctly', () => {
      const store = useAuthStore()

      expect(store.userName).toBe('')

      store.user = { user_id: 1, username: 'testuser' }

      expect(store.userName).toBe('testuser')
    })
  })
})