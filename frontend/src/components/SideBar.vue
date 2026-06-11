<template>
  <aside 
    :class="[
      'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Toggle Button -->
    <button
      @click="toggleSidebar"
      class="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
    >
      <ChevronLeftIcon v-if="!isCollapsed" class="h-4 w-4 text-gray-500" />
      <ChevronRightIcon v-else class="h-4 w-4 text-gray-500" />
    </button>

    <!-- Sidebar Content -->
    <div class="h-full overflow-y-auto py-4">
      <!-- Main Navigation -->
      <nav class="space-y-1 px-2">
        <div v-if="!isCollapsed" class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>

        <router-link
          v-for="item in mainMenuItems"
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

      <!-- Admin Section -->
      <div class="mt-8">
        <nav class="space-y-1 px-2">
          <div v-if="!isCollapsed" class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administration
          </div>

          <router-link
            v-for="item in adminMenuItems"
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
            <span 
              v-if="!isCollapsed && item.badge" 
              class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </nav>
      </div>

      <!-- Quick Stats (when expanded) -->
      <div v-if="!isCollapsed" class="mt-8 px-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Students</span>
              <span class="font-medium text-gray-900">{{ stats.students }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Classes</span>
              <span class="font-medium text-gray-900">{{ stats.classes }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Pending</span>
              <span class="font-medium text-orange-600">{{ stats.pending }}</span>
            </div>
          </div>
        </div>
      </div>
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
  ArrowsUpDownIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const isCollapsed = ref(false)

const stats = ref({
  students: '-',
  classes: '-',
  pending: '-'
})

const mainMenuItems = [
  { name: 'dashboard', path: '/', label: 'Dashboard', icon: HomeIcon },
  { name: 'upload', path: '/upload', label: 'Upload', icon: CloudArrowUpIcon },
  { name: 'history', path: '/history', label: 'History', icon: ClockIcon },
  { name: 'manual-fees', path: '/manual-fees', label: 'Manual Entry', icon: DocumentPlusIcon },
  { name: 'charges', path: '/charges', label: 'Charges', icon: BanknotesIcon },
  { name: 'receipts', path: '/receipts', label: 'Receipts', icon: DocumentTextIcon },
]

const adminMenuItems = [
  { name: 'students', path: '/admin/students', label: 'Students', icon: UserGroupIcon },
  { name: 'promotion', path: '/admin/promotion', label: 'Student Promotion', icon: ArrowsUpDownIcon },
  { name: 'equity', path: '/admin/equity', label: 'Equity Transactions', icon: BanknotesIcon },
]

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
}

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

onMounted(() => {
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved) {
    isCollapsed.value = saved === 'true'
  }
})

defineExpose({ isCollapsed })
</script>
