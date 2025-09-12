<template>
  <AuthGuard>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Payment History</h1>
        <p class="mt-2 text-gray-600">
          View and search previous payment transactions
        </p>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CreditCardIcon class="h-8 w-8 text-primary-600" />
            </div>
            <div class="ml-4">
              <div class="text-2xl font-bold text-gray-900">
                {{ statistics?.totalPayments || 0 }}
              </div>
              <div class="text-sm text-gray-500">Total Payments</div>
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
                KSh {{ (statistics?.totalAmount || 0).toLocaleString() }}
              </div>
              <div class="text-sm text-gray-500">Total Amount</div>
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
                {{ statistics?.uniqueStudents || 0 }}
              </div>
              <div class="text-sm text-gray-500">Unique Students</div>
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
                KSh {{ (statistics?.averageAmount || 0).toLocaleString() }}
              </div>
              <div class="text-sm text-gray-500">Average Payment</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              class="input-field"
              placeholder="Student name, reference, etc."
              @input="debouncedSearch"
            />
          </div>

          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              v-model="startDate"
              type="date"
              class="input-field"
              @change="loadPayments"
            />
          </div>

          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              v-model="endDate"
              type="date"
              class="input-field"
              @change="loadPayments"
            />
          </div>

          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="btn-secondary w-full"
            >
              <XMarkIcon class="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Payment History Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Payment Records</h3>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">
                Showing {{ payments.length }} of {{ totalCount }} payments
              </span>
              <button
                @click="exportPayments"
                class="btn-secondary text-sm"
                :disabled="payments.length === 0"
              >
                <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Date</th>
                <th class="table-header">Student</th>
                <th class="table-header">Amount</th>
                <th class="table-header">Reference</th>
                <th class="table-header">Bank</th>
                <th class="table-header">Term/Year</th>
                <th class="table-header">Balance</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="payment in payments"
                :key="payment.payment_id"
                class="hover:bg-gray-50"
              >
                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(payment.dop) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ formatTime(payment.dop) }}
                  </div>
                </td>

                <td class="table-cell">
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
                        {{ payment.name1 }} {{ payment.name2 }} {{ payment.name3 || '' }}
                      </div>
                      <div class="text-xs text-gray-500">
                        ADM: {{ payment.adm }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="table-cell">
                  <div class="text-sm font-medium text-gray-900">
                    KSh {{ payment.amount.toLocaleString() }}
                  </div>
                </td>

                <td class="table-cell">
                  <div class="text-sm text-gray-900 font-mono">
                    {{ payment.ref }}
                  </div>
                </td>

                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ payment.bank || 'N/A' }}
                  </div>
                </td>

                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ payment.term }} {{ payment.year_paid }}
                  </div>
                </td>

                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    KSh {{ (payment.balance || 0).toLocaleString() }}
                  </div>
                </td>

                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewPaymentDetails(payment)"
                      class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      @click="printReceipt(payment)"
                      class="text-gray-600 hover:text-gray-700 text-sm font-medium"
                    >
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="payments.length === 0 && !isLoading" class="text-center py-12">
          <ClockIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">No payment records found</p>
          <p class="text-sm text-gray-400 mt-1">
            {{ searchQuery || startDate || endDate ? 'Try adjusting your filters' : 'No payments have been processed yet' }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading payment history...</p>
        </div>

        <!-- Pagination -->
        <div v-if="payments.length > 0" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} results
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="previousPage"
                :disabled="currentPage <= 1"
                class="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon class="h-4 w-4 mr-1" />
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPages"
                class="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon class="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Details Modal -->
      <PaymentDetailsModal
        v-if="showPaymentDetails"
        :payment="selectedPayment"
        @close="closePaymentDetails"
      />
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { paymentApi } from '@/services/api'
import { useToast } from 'vue-toastification'
import AuthGuard from '@/components/AuthGuard.vue'
import PaymentDetailsModal from '@/components/PaymentDetailsModal.vue'
import {
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

// State
const toast = useToast()
const isLoading = ref(false)
const payments = ref<any[]>([])
const statistics = ref<any>(null)
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const totalCount = ref(0)
const showPaymentDetails = ref(false)
const selectedPayment = ref<any>(null)

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadPayments()
  }, 300)
}

// Methods
const loadPayments = async () => {
  isLoading.value = true
  
  try {
    const offset = (currentPage.value - 1) * pageSize.value
    const response = await paymentApi.getHistory(pageSize.value, offset)
    
    if (response.success && response.data) {
      payments.value = response.data.payments
      totalCount.value = response.data.pagination?.total || payments.value.length
    } else {
      throw new Error(response.error?.message || 'Failed to load payments')
    }
  } catch (error) {
    console.error('Load payments error:', error)
    toast.error('Failed to load payment history')
  } finally {
    isLoading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await paymentApi.getStatistics(startDate.value, endDate.value)
    
    if (response.success && response.data) {
      statistics.value = response.data.statistics
    }
  } catch (error) {
    console.error('Load statistics error:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadPayments()
  loadStatistics()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadPayments()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadPayments()
  }
}

const viewPaymentDetails = (payment: any) => {
  selectedPayment.value = payment
  showPaymentDetails.value = true
}

const closePaymentDetails = () => {
  showPaymentDetails.value = false
  selectedPayment.value = null
}

const printReceipt = (payment: any) => {
  // Implement receipt printing
  toast.info('Receipt printing feature coming soon')
}

const exportPayments = () => {
  // Implement CSV export
  const csvContent = generateCSV(payments.value)
  downloadCSV(csvContent, 'payment-history.csv')
  toast.success('Payment history exported')
}

const generateCSV = (data: any[]) => {
  const headers = ['Date', 'Student Name', 'Admission', 'Amount', 'Reference', 'Bank', 'Term', 'Year', 'Balance']
  const rows = data.map(payment => [
    formatDate(payment.dop),
    `${payment.name1} ${payment.name2} ${payment.name3 || ''}`.trim(),
    payment.adm,
    payment.amount,
    payment.ref,
    payment.bank || '',
    payment.term,
    payment.year_paid,
    payment.balance || 0
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString()
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

// Lifecycle
onMounted(() => {
  loadPayments()
  loadStatistics()
})
</script>