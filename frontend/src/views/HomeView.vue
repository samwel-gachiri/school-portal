<template>
  <AuthGuard>
    <div class="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">
          Welcome back, {{ userName }}!
        </h1>
        
        <router-link
          to="/manual-fees"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg class="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Student Payment
        </router-link>
      </div>
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthGuard from '@/components/AuthGuard.vue'

const authStore = useAuthStore()
const userName = computed(() => authStore.userName)
</script>