<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <div class="bg-white shadow-md rounded-lg p-6">
        <div class="flex items-center mb-4">
          <ExclamationTriangleIcon class="h-8 w-8 text-red-500 mr-3" />
          <h2 class="text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>
        </div>
        
        <p class="text-gray-600 mb-6">
          An unexpected error occurred. We've been notified and are working to fix it.
        </p>
        
        <div v-if="showDetails" class="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
          <p class="text-sm text-gray-600 font-mono">{{ errorMessage }}</p>
        </div>
        
        <div class="flex space-x-3">
          <button
            @click="retry"
            class="btn-primary flex-1"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <button
            @click="goHome"
            class="btn-secondary flex-1"
          >
            <HomeIcon class="h-4 w-4 mr-2" />
            Go Home
          </button>
        </div>
        
        <div class="mt-4 text-center">
          <button
            @click="showDetails = !showDetails"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            {{ showDetails ? 'Hide' : 'Show' }} Details
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon
} from '@heroicons/vue/24/outline'

// State
const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')
const showDetails = ref(false)

// Error handling
onErrorCaptured((error: Error, instance, info) => {
  console.error('Error boundary caught:', {
    error: error.message,
    stack: error.stack,
    instance: instance?.$?.type?.name || 'Unknown',
    info,
    timestamp: new Date().toISOString()
  })

  hasError.value = true
  errorMessage.value = error.message || 'Unknown error occurred'

  // Return false to prevent the error from propagating further
  return false
})

// Methods
const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  showDetails.value = false
  
  // Force component re-render
  window.location.reload()
}

const goHome = () => {
  hasError.value = false
  router.push('/')
}
</script>