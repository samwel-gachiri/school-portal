<template>
  <AuthGuard>
    <div class="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Print Payment Receipts</h1>
      </div>



      <!-- Filters and Search -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input id="search" v-model="searchQuery" type="text" class="input-field" placeholder="Student name, adm..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select v-model="classId" @change="loadPayments" class="input-field bg-white">
              <option value="">All Classes</option>
              <option v-for="c in classes" :key="c.class_id" :value="c.class_id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select v-model="term" @change="loadPayments" class="input-field bg-white">
              <option value="">All Terms</option>
              <option value="ONE">ONE</option>
              <option value="TWO">TWO</option>
              <option value="THREE">THREE</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input v-model="year" type="number" @change="loadPayments" class="input-field" placeholder="e.g. 2026" />
          </div>
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input id="startDate" v-model="startDate" type="date" class="input-field" @change="loadPayments" />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input id="endDate" v-model="endDate" type="date" class="input-field" @change="loadPayments" />
          </div>
          <div class="flex items-end">
            <button @click="clearFilters" class="btn-secondary w-full">
              <XMarkIcon class="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Controls -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">

          </div>
          <div class="flex items-center space-x-4">

            <button
              @click="printSelected"
              :disabled="selectedPayments.length === 0"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PrinterIcon class="h-4 w-4 mr-2" />
              Print Selected ({{ selectedPayments.length }})
            </button>
          </div>
        </div>
      </div>

      <!-- Payment History Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Select payments to print Receipts for</h3>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">
                Showing {{ filteredPayments.length }} of {{ payments.length }} payments
              </span>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header w-12">
                  <input
                    type="checkbox"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th class="table-header">Date</th>
                <th class="table-header">Student</th>
                <th class="table-header">Amount</th>
                <th class="table-header">Reference</th>
                <th class="table-header">Bank</th>
                <th class="table-header">Term/Year</th>
                <th class="table-header">Balance</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="payment in filteredPayments"
                :key="payment.payment_id"
                class="hover:bg-gray-50"
                :class="{ 'bg-blue-50': isSelected(payment.payment_id) }"
              >
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      :checked="isSelected(payment.payment_id)"
                      @change="toggleSelection(payment.payment_id)"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span v-if="isSelected(payment.payment_id)" class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                      {{ selectedPayments.indexOf(payment.payment_id) + 1 }}
                    </span>
                  </div>
                </td>
                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(payment.dop) }}
                  </div>
                  <!-- <div class="text-xs text-gray-500">
                    {{ formatTime(payment.dop) }}
                  </div> -->
                </td>

                <td class="table-cell">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span class="text-xs font-medium text-gray-600">
                          {{ getInitials(payment.name) }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ payment.name }}
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
                  <div class="text-sm text-gray-900 font-mono flex items-center space-x-2">
                    <span>{{ payment.ref }}</span>
                    <span v-if="payment.is_printed === 'yes'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Printed
                    </span>
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
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPayments.length === 0 && !isLoading" class="text-center py-12">
          <ClockIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">No payment records found</p>
          <p class="text-sm text-gray-400 mt-1">
            {{ searchQuery || startDate || endDate ? 'Try adjusting your filters' : 'No payments have been processed yet' }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading payment records...</p>
        </div>
      </div>

      <!-- Receipt Preview Modal -->
      <ReceiptPreviewModal
        v-if="showPreview"
        :receipts="receiptsToPrint"
        :print-config="printConfig"
        @close="showPreview = false"
        @print="handlePrint"
      />
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import AuthGuard from '@/components/AuthGuard.vue'
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal.vue'
import {
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon,
  PrinterIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

interface Receipt {
  name: string
  adm: number
  payment_id: number
  term: string
  year_paid: number
  amount: number
  balance: number
  dop: string
  bank: string
  ref: string
  section?: string
  is_printed?: string
}

// State
const isLoading = ref(false)
const payments = ref<Receipt[]>([])
const searchQuery = ref('')
const classId = ref('')
const term = ref('')
const year = ref<number | ''>('')
const startDate = ref('')
const endDate = ref('')
const classes = ref<any[]>([])
const selectedPayments = ref<number[]>([])
const selectAll = ref(false)
const showPreview = ref(false)
const printConfig = ref<any>(null)
const receiptsToPrint = ref<Receipt[]>([])

// Computed
const filteredPayments = computed(() => {
  let filtered = payments.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(payment =>
      payment.name.toLowerCase().includes(query) ||
      payment.ref.toLowerCase().includes(query) ||
      payment.adm.toString().includes(query)
    )
  }

  return filtered
})

const totalAmount = computed(() => {
  return payments.value.reduce((sum, payment) => sum + payment.amount, 0)
})

const uniqueStudents = computed(() => {
  const students = new Set(payments.value.map(p => p.adm))
  return students.size
})

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    // Search is reactive through computed property
  }, 300)
}

// Methods
const loadPayments = async () => {
  isLoading.value = true

  try {
    const params = new URLSearchParams()
    params.append('limit', '1000')
    if (classId.value) params.append('classId', classId.value)
    if (term.value) params.append('term', term.value)
    if (year.value) params.append('year', year.value.toString())
    if (startDate.value) params.append('startDate', startDate.value)
    if (endDate.value) params.append('endDate', endDate.value)

    const response = await api.get(`/receipts/previous?${params.toString()}`)
    payments.value = response.data || []
  } catch (error) {
    console.error('Load payments error:', error)
    payments.value = []
  } finally {
    isLoading.value = false
  }
}

const loadInitialData = async () => {
  try {
    const schoolRes = await api.get<any>('/school/info')
    if (schoolRes.success && schoolRes.data) {
      term.value = '' // Default to all terms
      year.value = schoolRes.data.year || new Date().getFullYear()
    }
    
    const res = await api.get<any>('/charges/defaults')
    if (res.success && res.data && res.data.classes) {
      classes.value = res.data.classes
    }
  } catch (e) {
    console.error('Failed to load initial data', e)
  }
}

const loadPrintConfig = async () => {
  try {
    const response = await api.get('/receipts/config')
    printConfig.value = response.data
  } catch (error) {
    console.error('Error loading print config:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  classId.value = ''
  term.value = ''
  year.value = ''
  startDate.value = ''
  endDate.value = ''
  selectedPayments.value = []
  selectAll.value = false
  loadPayments()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedPayments.value = filteredPayments.value.map(p => p.payment_id)
  } else {
    selectedPayments.value = []
  }
}

const toggleSelection = (paymentId: number) => {
  const index = selectedPayments.value.indexOf(paymentId)
  if (index === -1) {
    selectedPayments.value.push(paymentId)
  } else {
    selectedPayments.value.splice(index, 1)
  }
}

const isSelected = (paymentId: number) => {
  return selectedPayments.value.includes(paymentId)
}

const printSelected = async () => {
  if (selectedPayments.value.length === 0) return

  try {
    // Skip preview, directly send to backend and launch printer
    await api.post('/receipts/print-receipts', { receiptNumbers: selectedPayments.value })

    // Launch standalone printer app
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.src = 'schoolprint://start'
    setTimeout(() => {
      document.body.removeChild(iframe)
      selectedPayments.value = []
      selectAll.value = false
    }, 1000)
  } catch (error) {
    console.error('Error preparing payments for printing:', error)
    alert('Error triggering printer')
  }
}

const handlePrint = async (receiptNumbers: number[]) => {
  try {
    // Mark receipts as printed (if needed)
    if (receiptNumbers.length > 0) {
      await api.post('/receipts/print-receipts', { receiptNumbers })
      
      // Trigger the local Java Desktop Application via Custom URI Protocol
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = 'schoolprint://start'
      document.body.appendChild(iframe)
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }

    showPreview.value = false
    selectedPayments.value = []
    selectAll.value = false

  } catch (error) {
    console.error('Error marking receipts as printed:', error)
    alert('Error updating receipt status')
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString()
}

const getInitials = (name: string) => {
  return name?.charAt(0) || ''
}

// Watch selectAll to sync with selectedPayments
import { watch } from 'vue'

watch(selectAll, (newVal) => {
  if (newVal) {
    selectedPayments.value = filteredPayments.value.map(p => p.payment_id)
  } else {
    selectedPayments.value = []
  }
})

watch(() => filteredPayments.value.length, () => {
  // Update selectAll when filtered results change
  if (selectedPayments.value.length === filteredPayments.value.length && filteredPayments.value.length > 0) {
    selectAll.value = true
  } else {
    selectAll.value = false
  }
})

// Lifecycle
onMounted(async () => {
  await loadInitialData()
  await loadPayments()
  await loadPrintConfig()
})
</script>