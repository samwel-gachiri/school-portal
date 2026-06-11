<template>
  <div id="app">
    <ErrorBoundary>
      <NavBar v-if="showNavBar" />
      <SideBar v-if="showSidebar" ref="sidebarRef" />
      <main 
        :class="[
          showNavBar ? 'pt-16' : '',
          showSidebar ? (sidebarCollapsed ? 'pl-16' : 'pl-64') : ''
        ]"
        class="transition-all duration-300"
      >
        <RouterView />
      </main>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/NavBar.vue'
import SideBar from '@/components/SideBar.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorHandler from '@/utils/errorHandler'

const route = useRoute()
const authStore = useAuthStore()
const sidebarRef = ref<InstanceType<typeof SideBar> | null>(null)

// Show navigation bar only when authenticated and not on login page
const showNavBar = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})

// Show sidebar only when authenticated and not on login page
const showSidebar = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})

// Track sidebar collapsed state
const sidebarCollapsed = computed(() => {
  return sidebarRef.value?.isCollapsed ?? false
})

// Initialize auth on app mount
onMounted(() => {
  // Only setup token expiration if we have a token
  if (localStorage.getItem('auth_token')) {
    authStore.setupTokenExpiration()
  }
  ErrorHandler.setupGlobalErrorHandlers()
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>