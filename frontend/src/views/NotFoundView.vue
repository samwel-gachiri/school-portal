<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-300">404</h1>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p class="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div class="space-y-4">
        <router-link
          to="/"
          class="btn-primary w-full"
        >
          <HomeIcon class="h-5 w-5 mr-2" />
          Go to Dashboard
        </router-link>
        
        <button
          @click="$router.go(-1)"
          class="btn-secondary w-full"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HomeIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
</script>