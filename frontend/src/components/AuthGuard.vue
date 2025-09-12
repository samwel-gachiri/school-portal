<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Verifying authentication...</p>
    </div>
  </div>
  
  <slot v-else-if="isAuthenticated" />
  
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full text-center">
      <div class="bg-white shadow-md rounded-lg p-6">
        <ExclamationTriangleIcon class="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h2>
        <p class="text-gray-600 mb-6">
          You need to be logged in to access this page.
        </p>
        <button
          @click="redirectToLogin"
          class="btn-primary w-full"
        >
          Go to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

// Computed properties
const isLoading = computed(() => authStore.isLoading)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Methods
const redirectToLogin = () => {
  router.push('/login')
}

// Initialize authentication check on mount
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuth()
  }
})
</script>