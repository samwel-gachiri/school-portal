<template>
  <nav class="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/" class="text-xl font-bold text-primary-600">
              School Portal
            </router-link>
          </div>
          
          <!-- Navigation Links -->
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <router-link
              to="/"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'home' }"
            >
              <HomeIcon class="h-5 w-5 mr-2" />
              Dashboard
            </router-link>
            
            <router-link
              to="/upload"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'upload' }"
            >
              <CloudArrowUpIcon class="h-5 w-5 mr-2" />
              Upload
            </router-link>
            
            <router-link
              to="/history"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'history' }"
            >
              <ClockIcon class="h-5 w-5 mr-2" />
              History
            </router-link>
            
            <router-link
              to="/manual-fees"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'manual-fees' }"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Manual Entry
            </router-link>
            
            <router-link
              to="/receipts"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'receipts' }"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.72 13.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18M12 2.25c-2.16 0-4.5.47-6.72 1.41C3.06 4.41 2.25 5.16 2.25 6v12c0 .84.81 1.59 3.06 2.34 2.22.94 4.56 1.41 6.72 1.41s4.5-.47 6.72-1.41c2.25-.75 3.06-1.5 3.06-2.34V6c0-.84-.81-1.59-3.06-2.34C16.5 2.78 14.16 2.25 12 2.25z"></path>
              </svg>
              Receipts
            </router-link>

            <router-link
              to="/charges"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'charges' }"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Charges
            </router-link>
          </div>
        </div>
        
        <!-- User Menu -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-sm font-medium text-white">
                    {{ userInitials }}
                  </span>
                </div>
              </button>
              
              <!-- User Dropdown Menu -->
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-show="showUserMenu"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  @click.away="showUserMenu = false"
                >
                  <div class="py-1">
                    <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div class="font-medium">{{ userName }}</div>
                      <div class="text-xs text-gray-500">Data Entry</div>
                    </div>
                    
                    <button
                      @click="handleLogout"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon class="h-4 w-4 mr-2 inline" />
                      Sign out
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
        
        <!-- Mobile menu button -->
        <div class="sm:hidden flex items-center">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!showMobileMenu" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    <div v-show="showMobileMenu" class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <router-link
          to="/"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'home' }"
          @click="showMobileMenu = false"
        >
          <HomeIcon class="h-5 w-5 mr-3" />
          Dashboard
        </router-link>
        
        <router-link
          to="/upload"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'upload' }"
          @click="showMobileMenu = false"
        >
          <CloudArrowUpIcon class="h-5 w-5 mr-3" />
          Upload
        </router-link>
        
        <router-link
          to="/history"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'history' }"
          @click="showMobileMenu = false"
        >
          <ClockIcon class="h-5 w-5 mr-3" />
          History
        </router-link>
        
        <router-link
          to="/manual-fees"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'manual-fees' }"
          @click="showMobileMenu = false"
        >
          <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Manual Entry
        </router-link>
        
        <router-link
          to="/receipts"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'receipts' }"
          @click="showMobileMenu = false"
        >
          <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.72 13.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18m6.72-4.829c-.24.06-.48.12-.72.18M12 2.25c-2.16 0-4.5.47-6.72 1.41C3.06 4.41 2.25 5.16 2.25 6v12c0 .84.81 1.59 3.06 2.34 2.22.94 4.56 1.41 6.72 1.41s4.5-.47 6.72-1.41c2.25-.75 3.06-1.5 3.06-2.34V6c0-.84-.81-1.59-3.06-2.34C16.5 2.78 14.16 2.25 12 2.25z"></path>
          </svg>
          Receipts
        </router-link>

        <router-link
          to="/charges"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'charges' }"
          @click="showMobileMenu = false"
        >
          <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Charges
        </router-link>
      </div>
      
      <div class="pt-4 pb-3 border-t border-gray-200">
        <div class="px-4">
          <div class="text-base font-medium text-gray-800">{{ userName }}</div>
          <div class="text-sm text-gray-500">Data Entry</div>
        </div>
        <div class="mt-3 space-y-1">
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import {
  HomeIcon,
  CloudArrowUpIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

// Computed
const userName = computed(() => authStore.userName)
const userInitials = computed(() => {
  const name = authStore.userName
  return name ? name.substring(0, 2).toUpperCase() : 'U'
})

// Methods
const handleLogout = async () => {
  showUserMenu.value = false
  showMobileMenu.value = false
  
  await authStore.logout()
  toast.info('You have been logged out')
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200;
}

.nav-link-active {
  @apply border-primary-500 text-primary-600;
}

.mobile-nav-link {
  @apply block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 flex items-center;
}

.mobile-nav-link-active {
  @apply bg-primary-50 border-primary-500 text-primary-700;
}
</style>