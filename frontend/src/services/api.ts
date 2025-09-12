import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse, User } from '@/types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private async handleResponse<T>(response: AxiosResponse): Promise<ApiResponse<T>> {
    return response.data
  }

  private async handleError(error: any): Promise<ApiResponse> {
    if (error.response?.data) {
      return error.response.data
    }
    
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred'
      },
      timestamp: new Date().toISOString()
    }
  }

  // Generic API methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get(url, { params })
      return this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post(url, data, config)
      return this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(url, data)
      return this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(url)
      return this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

// Create API service instance
const apiService = new ApiService()

// Authentication API
export const authApi = {
  login: (username: string, password: string) =>
    apiService.post<{ token: string; user: User }>('/auth/login', { username, password }),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  verify: () =>
    apiService.get<{ user: User; valid: boolean }>('/auth/verify')
}

// File upload API
export const uploadApi = {
  uploadImage: (file: File, onProgress?: (progress: number) => void) =>
    apiService.uploadFile<{ fileId: string; originalName: string; size: number; mimeType: string; base64Data: string }>('/upload/image', file, onProgress)
}

// AI processing API
export const processApi = {
  extractPaymentData: (imageBase64: string, customInstructions?: string) =>
    apiService.post('/process/extract', { imageBase64, customInstructions }, {
      timeout: 120000 // 2 minutes for AI processing
    }),
  
  validateExtractedData: (extractedData: any[]) =>
    apiService.post('/process/validate', { extractedData }),
  
  testAIConnection: () =>
    apiService.get('/process/ai/test')
}

// Student API
export const studentApi = {
  search: (query: string, searchType: string = 'all', limit: number = 50) =>
    apiService.get('/students/search', { query, searchType, limit }),
  
  matchStudents: (payments: any[], matchThreshold: number = 0.5) =>
    apiService.post('/students/match', { payments, matchThreshold }),
  
  getDetails: (admissionNumber: number) =>
    apiService.get(`/students/${admissionNumber}`),
  
  manualMatch: (paymentId: string, admissionNumber: number, confirmed: boolean = false) =>
    apiService.post('/students/manual-match', { paymentId, admissionNumber, confirmed })
}

// Payment API
export const paymentApi = {
  validateBatch: (paymentRecords: any[]) =>
    apiService.post('/payments/validate-batch', { paymentRecords }, {
      timeout: 60000 // 1 minute for validation
    }),
  
  processBatch: (paymentRecords: any[], confirmed: boolean = true) =>
    apiService.post('/payments/process-batch', { paymentRecords, confirmed }, {
      timeout: 180000 // 3 minutes for batch processing
    }),
  
  getHistory: (limit: number = 50, offset: number = 0) =>
    apiService.get('/payments/history', { limit, offset }),
  
  getStatistics: (startDate?: string, endDate?: string) =>
    apiService.get('/payments/statistics', { startDate, endDate })
}

export default apiService