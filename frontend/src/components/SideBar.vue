<template>
    <aside class="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 w-64 flex flex-col">

    <!-- User Menu (Top Left) -->
    <div class="relative p-4 border-b border-gray-200 bg-primary-50">
      <button @click="showUserMenu = !showUserMenu" class="w-full flex items-center justify-between focus:outline-none">
        <div class="flex items-center">
          <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center shadow-sm">
            <span class="text-sm font-medium text-white">
              {{ userInitials }}
            </span>
          </div>
          <div class="ml-3 text-left">
            <div class="text-sm font-medium text-gray-800">{{ userName }}</div>
          </div>
        </div>
      </button>

      <!-- Dropdown -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="showUserMenu" class="absolute left-4 top-16 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div class="py-1">
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors text-red-600"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5 mr-3" />
              <span class="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Sidebar Content -->
    <div class="flex-1 overflow-y-auto py-4">
      <template v-for="(group, index) in menuGroups" :key="group.title">
        <div :class="group.title === 'Dashboard' ? 'mb-2' : 'mt-2 mb-2'">
          <nav class="space-y-1 px-2">
            <div v-if="!isCollapsed && group.title !== 'Dashboard'" class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ group.title }}
            </div>

            <router-link
              v-for="item in group.items"
              :key="item.name"
              :to="item.path"
              :class="[
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.path) 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              ]"
              :title="isCollapsed ? item.label : ''"
            >
              <component 
                :is="item.icon" 
                :class="[
                  'flex-shrink-0 h-5 w-5',
                  isActive(item.path) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                ]" 
              />
              <span v-if="!isCollapsed" class="ml-3">{{ item.label }}</span>
            </router-link>
          </nav>
        </div>
        <hr v-if="index < menuGroups.length - 1" class="my-4 border-gray-200 mx-4" />
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  CloudArrowUpIcon,
  ClockIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ArrowsUpDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.userName)
const userInitials = computed(() => {
  const name = authStore.userName
  return name ? name.substring(0, 2).toUpperCase() : 'U'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
const isCollapsed = ref(false)
const showUserMenu = ref(false)

const menuGroups = [
  {
    title: 'Dashboard',
    items: [
      { name: 'dashboard', path: '/', label: 'Dashboard', icon: HomeIcon }
    ]
  },
  {
    title: 'Students',
    items: [
      { name: 'students', path: '/admin/students', label: 'Students', icon: UserGroupIcon }
    ]
  },
  {
    title: 'Classes',
    items: [
      { name: 'classes', path: '/admin/classes', label: 'Classes', icon: AcademicCapIcon }
    ]
  },
  {
    title: 'Finances',
    items: [
      { name: 'manual-fees', path: '/manual-fees', label: 'Record payment', icon: DocumentPlusIcon },
    ]
  },
  {
    title: 'Charges',
    items: [
      { name: 'charges', path: '/charges', label: 'Charges', icon: BanknotesIcon }
    ]
  },
  {
    title: 'Receipts',
    items: [
      { name: 'receipts', path: '/receipts', label: 'Receipts', icon: DocumentTextIcon }
    ]
  }
]
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
onMounted(() => {
})

defineExpose({ isCollapsed })
</script>
