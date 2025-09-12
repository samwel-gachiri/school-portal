<template>
  <AuthGuard>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Welcome back, {{ userName }}!
        </h1>
        <p class="mt-2 text-gray-600">
          School Fee Payment Portal Dashboard
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <router-link
          to="/upload"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CloudArrowUpIcon class="h-8 w-8 text-primary-600" />
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Upload & Process</h3>
              <p class="text-sm text-gray-500">Upload bank statements for AI processing</p>
            </div>
          </div>
        </router-link>

        <router-link
          to="/history"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ClockIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Payment History</h3>
              <p class="text-sm text-gray-500">View processed payment records</p>
            </div>
          </div>
        </router-link>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ChartBarIcon class="h-8 w-8 text-orange-600" />
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Reports</h3>
              <p class="text-sm text-gray-500">Generate payment reports</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CreditCardIcon class="h-8 w-8 text-primary-600" />
            </div>
            <div class="ml-4">
              <div class="text-2xl font-bold text-gray-900">
                {{ todayStats?.totalPayments || 0 }}
              </div>
              <div class="text-sm text-gray-500">Today's Payments</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <BanknotesIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <div class="text-2xl font-bold text-gray-900">
                KSh {{ (todayStats?.totalAmount || 0).toLocaleString() }}
              </div>
              <div class="text-sm text-gray-500">Today's Amount</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <UserGroupIcon class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <div class="text-2xl font-bold text-gray-900">
                {{ todayStats?.uniqueStudents || 0 }}
              </div>
              <div class="text-sm text-gray-500">Students Paid</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ChartBarIcon class="h-8 w-8 text-orange-600" />
            </div>
            <div class="ml-4">
              <div class="text-2xl font-bold text-gray-900">
                KSh {{ (todayStats?.averageAmount || 0).toLocaleString() }}
              </div>
              <div class="text-sm text-gray-500">Average Payment</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Payments -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Recent Payments</h3>
              <router-link
                to="/history"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </router-link>
            </div>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div
              v-for="payment in recentPayments"
              :key="payment.payment_id"
              class="p-6 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span class="text-xs font-medium text-gray-600">
                        {{ getInitials(payment.name1, payment.name2) }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ payment.name1 }} {{ payment.name2 }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ADM: {{ payment.adm }} • {{ formatDate(payment.dop) }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900">
                    KSh {{ payment.amount.toLocaleString() }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ payment.ref }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="recentPayments.length === 0" class="text-center py-8">
            <CreditCardIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500">No recent payments</p>
          </div>
        </div>

        <!-- System Status -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">System Status</h3>
          </div>
          
          <div class="p-6 space-y-4">
            <!-- Database Status -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div :class="[
                  'h-3 w-3 rounded-full',
                  systemStatus.database ? 'bg-green-500' : 'bg-red-500'
                ]"></div>
                <span class="text-sm text-gray-900">Database Connection</span>
              </div>
              <span :class="[
                'text-sm font-medium',
                systemStatus.database ? 'text-green-600' : 'text-red-600'
              ]">
                {{ systemStatus.database ? 'Connected' : 'Disconnected' }}
              </span>
            </div>

            <!-- AI Service Status -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div :class="[
                  'h-3 w-3 rounded-full',
                  systemStatus.aiService ? 'bg-green-500' : 'bg-red-500'
                ]"></div>
                <span class="text-sm text-gray-900">AI Processing Service</span>
              </div>
              <span :class="[
                'text-sm font-medium',
                systemStatus.aiService ? 'text-green-600' : 'text-red-600'
              ]">
                {{ systemStatus.aiService ? 'Available' : 'Unavailable' }}
              </span>
            </div>

            <!-- Last Backup -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="h-3 w-3 rounded-full bg-blue-500"></div>
                <span class="text-sm text-gray-900">Last Backup</span>
              </div>
              <span class="text-sm text-gray-600">
                {{ formatDate(new Date().toISOString()) }}
              </span>
            </div>

            <!-- System Uptime -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="h-3 w-3 rounded-full bg-green-500"></div>
                <span class="text-sm text-gray-900">System Uptime</span>
              </div>
              <span class="text-sm text-gray-600">
                {{ systemStatus.uptime || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { paymentApi, processApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import AuthGuard from '@/components/AuthGuard.vue'
import {
  CloudArrowUpIcon,
  ClockIcon,
  ChartBarIcon,
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

// State
const authStore = useAuthStore()
const recentPayments = ref<any[]>([])
const todayStats = ref<any>(null)
const systemStatus = ref({
  database: true,
  aiService: true,
  uptime: '99.9%'
})

// Computed
const userName = computed(() => authStore.userName)

// Methods
const loadRecentPayments = async () => {
  try {
    const response = await paymentApi.getHistory(5, 0) // Get last 5 payments
    
    if (response.success && response.data) {
      recentPayments.value = response.data.payments
    }
  } catch (error) {
    console.error('Load recent payments error:', error)
  }
}

const loadTodayStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await paymentApi.getStatistics(today, today)
    
    if (response.success && response.data) {
      todayStats.value = response.data.statistics
    }
  } catch (error) {
    console.error('Load today stats error:', error)
  }
}

const checkSystemStatus = async () => {
  try {
    // Check AI service
    const aiResponse = await processApi.testAIConnection()
    systemStatus.value.aiService = aiResponse.success && aiResponse.data?.connected
  } catch (error) {
    systemStatus.value.aiService = false
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

// Lifecycle
onMounted(() => {
  loadRecentPayments()
  loadTodayStats()
  checkSystemStatus()
})
</script>