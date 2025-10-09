import { useToast } from 'vue-toastification'
import type { ApiResponse } from '@/types'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: string
}

export class ErrorHandler {
  private static toast = useToast()

  static handleApiError(
    error: any, 
    context?: ErrorContext,
    showToast: boolean = true
  ): string {
    let message = 'An unexpected error occurred'
    let errorCode = 'UNKNOWN_ERROR'

    // Extract error information
    if (error?.response?.data) {
      // Axios error with API response
      const apiError = error.response.data as ApiResponse
      message = apiError.error?.message || message
      errorCode = apiError.error?.code || errorCode
    } else if (error?.message) {
      // JavaScript error
      message = error.message
    }

    // Log error for debugging
    console.error('Error occurred:', {
      message,
      errorCode,
      context,
      originalError: error,
      timestamp: new Date().toISOString()
    })

    // Show user-friendly messages
    const userMessage = this.getUserFriendlyMessage(errorCode, message)
    
    if (showToast) {
      this.toast.error(userMessage)
    }

    return userMessage
  }

  static handleNetworkError(error: any, showToast: boolean = true): string {
    let message = 'Network connection failed. Please check your internet connection.'

    if (error?.code === 'NETWORK_ERROR') {
      message = 'Unable to connect to the server. Please try again later.'
    } else if (error?.response?.status === 0) {
      message = 'Server is not responding. Please try again later.'
    }

    if (showToast) {
      this.toast.error(message)
    }

    console.error('Network error:', error)
    return message
  }

  static handleValidationError(
    errors: Record<string, string[]>,
    showToast: boolean = true
  ): string[] {
    const messages: string[] = []

    Object.entries(errors).forEach(([field, fieldErrors]) => {
      fieldErrors.forEach(error => {
        const message = `${field}: ${error}`
        messages.push(message)
        
        if (showToast) {
          this.toast.error(message)
        }
      })
    })

    return messages
  }

  static handleFileUploadError(error: any, showToast: boolean = true): string {
    let message = 'File upload failed'

    if (error?.message?.includes('File size')) {
      message = 'File is too large. Please select a smaller file.'
    } else if (error?.message?.includes('File type')) {
      message = 'Invalid file type. Please select a JPG, PNG, or PDF file.'
    } else if (error?.message?.includes('Network')) {
      message = 'Upload failed due to network issues. Please try again.'
    }

    if (showToast) {
      this.toast.error(message)
    }

    return message
  }

  static handleAuthError(error: any, showToast: boolean = true): string {
    let message = 'Authentication failed'

    if (error?.response?.status === 401) {
      message = 'Your session has expired. Please log in again.'
      // Redirect to login page
      window.location.href = '/login'
    } else if (error?.response?.status === 403) {
      message = 'You do not have permission to perform this action.'
    }

    if (showToast) {
      this.toast.error(message)
    }

    return message
  }

  private static getUserFriendlyMessage(errorCode: string, originalMessage: string): string {
    const friendlyMessages: Record<string, string> = {
      // Authentication errors
      'UNAUTHORIZED': 'Please log in to continue',
      'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
      'INVALID_TOKEN': 'Authentication failed. Please log in again.',
      'LOGIN_FAILED': 'Invalid username or password',

      // Validation errors
      'VALIDATION_ERROR': 'Please check your input and try again',
      'MISSING_REQUIRED_FIELD': 'Please fill in all required fields',

      // File upload errors
      'FILE_TOO_LARGE': 'File is too large. Please select a smaller file.',
      'INVALID_FILE_TYPE': 'Invalid file type. Please select a JPG, PNG, or PDF file.',
      'UPLOAD_FAILED': 'File upload failed. Please try again.',

      // AI processing errors
      'AI_RATE_LIMIT': 'AI service is busy. Please try again in a few minutes.',
      'AI_QUOTA_EXCEEDED': 'AI service quota exceeded. Please contact support.',
      'AI_AUTH_ERROR': 'AI service authentication failed. Please contact support.',
      'EXTRACTION_FAILED': 'Failed to extract data from image. Please try a different image.',

      // Database errors
      'DATABASE_CONNECTION_ERROR': 'Database connection failed. Please try again later.',
      'DATABASE_AUTH_ERROR': 'Database authentication failed. Please contact support.',
      'STUDENT_NOT_FOUND': 'Student not found in the database',
      'DUPLICATE_TRANSACTION': 'This transaction has already been processed',

      // Network errors
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
      'TIMEOUT_ERROR': 'Request timed out. Please try again.',

      // General errors
      'NOT_FOUND': 'The requested resource was not found',
      'INTERNAL_ERROR': 'An internal error occurred. Please try again later.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.'
    }

    return friendlyMessages[errorCode] || originalMessage || 'An unexpected error occurred'
  }

  static createErrorBoundary() {
    return {
      errorCaptured(error: Error, instance: any, info: string) {
        console.error('Vue error boundary caught:', {
          error: error.message,
          stack: error.stack,
          instance: instance?.$options?.name || 'Unknown',
          info,
          timestamp: new Date().toISOString()
        })

        // Show user-friendly error message
        this.toast.error('Something went wrong. Please refresh the page and try again.')

        // Return false to prevent the error from propagating further
        return false
      }
    }
  }

  static setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections - only show toast for critical errors
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Only show toast for network errors or critical failures
      const reason = event.reason
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const message = (reason as any).message
        if (message?.includes('Network') || message?.includes('fetch')) {
          this.toast.error('Network error occurred. Please check your connection.')
        }
      }
      
      event.preventDefault()
    })

    // Handle global JavaScript errors - only show toast for critical errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
      
      // Only show toast for critical errors, not for missing images/scripts
      if (event.message && !event.message.includes('Loading') && !event.message.includes('Script error')) {
        this.toast.error('An unexpected error occurred. Please refresh the page.')
      }
    })
  }
}

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> => {
  try {
    return await asyncFn()
  } catch (error) {
    ErrorHandler.handleApiError(error, context)
    return null
  }
}

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          ErrorHandler.handleApiError(error, context)
          throw error
        })
      }
      
      return result
    } catch (error) {
      ErrorHandler.handleApiError(error, context)
      throw error
    }
  }) as T
}

export default ErrorHandler