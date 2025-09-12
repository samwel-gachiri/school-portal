<template>
  <div id="app">
    <ErrorBoundary>
      <NavBar v-if="showNavBar" />
      <main :class="{ 'pt-16': showNavBar }">
        <RouterView />
      </main>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/NavBar.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorHandler from '@/utils/errorHandler'

const route = useRoute()
const authStore = useAuthStore()

// Show navigation bar only when authenticated and not on login page
const showNavBar = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})

// Initialize auth on app mount
onMounted(() => {
  authStore.setupTokenExpiration()
  ErrorHandler.setupGlobalErrorHandlers()
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>