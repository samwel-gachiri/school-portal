<template>
  <div id="app">
    <ErrorBoundary>
      <header v-if="showSidebar" class="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-8 shadow-sm">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-gray-800 tracking-wide">{{ schoolName }}</h1>
          <div class="h-6 w-px bg-gray-300"></div>
          <span class="text-sm font-medium text-gray-500 tracking-wider">
            Term {{ schoolTerm }} {{ schoolYear }}
          </span>
        </div>
        <div class="flex items-center">
          <img src="/logo.png" alt="School Logo" class="h-10 w-auto object-contain" />
        </div>
      </header>
      <SideBar v-if="showSidebar" ref="sidebarRef" />
      <main 
        :class="[
          showSidebar ? 'pl-64 pt-16' : ''
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
import api from '@/services/api'
import SideBar from '@/components/SideBar.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorHandler from '@/utils/errorHandler'

const route = useRoute()
const authStore = useAuthStore()
const sidebarRef = ref<InstanceType<typeof SideBar> | null>(null)

const schoolName = ref('Little Angels Academy')
const schoolTerm = ref('ONE')
const schoolYear = ref(new Date().getFullYear())



// Show sidebar only when authenticated and not on login page
const showSidebar = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})

// Track sidebar collapsed state
const sidebarCollapsed = computed(() => {
  return sidebarRef.value?.isCollapsed ?? false
})

// Initialize auth on app mount
onMounted(async () => {
  // Only setup token expiration if we have a token
  if (localStorage.getItem('auth_token')) {
    authStore.setupTokenExpiration()
    
    try {
      const res = await api.get<any>('/school/info')
      if (res.success && res.data) {
        schoolName.value = res.data.name || 'Little Angels Academy'
        schoolTerm.value = res.data.term || 'ONE'
        schoolYear.value = res.data.year || new Date().getFullYear()
      }
    } catch (e) {
      console.error('Failed to load school info', e)
    }
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