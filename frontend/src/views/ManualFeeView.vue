<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Add Payment</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <!-- Student Search Section -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Give in the name of the student</h2>
          <div class="relative">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
              Search by Admission Number or Name
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="Enter admission number or student name..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="handleSearch"
              @focus="showDropdown = true"
              @blur="hideDropdown"
            />
            
            <!-- Search Results Dropdown -->
            <div 
              v-if="showDropdown && searchResults.length > 0" 
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-300 overflow-auto focus:outline-none"
            >
              <div
                v-for="student in searchResults"
                :key="student.adm"
                @mousedown="selectStudent(student)"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span class="text-xs font-medium text-gray-600">
                        {{ student.name1?.charAt(0) }}{{ student.name2?.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">
                      {{ student.name1 }} {{ student.name2 }} {{ student.name3 || '' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ADM: {{ student.adm }} • {{ student.class_name || 'N/A' }} • Balance: KSh {{ student.balance.toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Loading State -->
            <div 
              v-if="showDropdown && isSearching" 
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-4 text-center border border-gray-300"
            >
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p class="text-sm text-gray-600">Searching students...</p>
            </div>
            
            <!-- No Results -->
            <div 
              v-if="showDropdown && !isSearching && searchResults.length === 0 && searchQuery.trim()" 
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-4 text-center border border-gray-300"
            >
              <p class="text-sm text-gray-500">No students found</p>
            </div>
          </div>
        </div>

        <!-- Student Details Display -->
        <div v-if="selectedStudent" class="mb-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 class="text-lg font-semibold text-blue-900 mb-3">Student Details</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-blue-700 font-medium">Admission No:</span>
              <div class="text-blue-900">{{ selectedStudent.adm }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Name:</span>
              <div class="text-blue-900">{{ selectedStudent.name1 }} {{ selectedStudent.name2 }} {{ selectedStudent.name3 || '' }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Class:</span>
              <div class="text-blue-900">{{ selectedStudent.class_name || 'N/A' }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Outstanding Balance:</span>
              <div class="text-blue-900 font-semibold" :class="selectedStudent.balance > 0 ? 'text-red-600' : 'text-green-600'">
                KSh {{ formatAmount(selectedStudent.balance) }}
              </div>
            </div>
          </div>

          <!-- Payment History -->
          <div v-if="paymentHistory.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Recent Payments</h4>
            <div class="max-h-32 overflow-y-auto">
              <table class="min-w-full text-xs">
                <thead class="bg-blue-100">
                  <tr>
                    <th class="px-2 py-1 text-left">Date</th>
                    <th class="px-2 py-1 text-left">Bank</th>
                    <th class="px-2 py-1 text-left">Reference</th>
                    <th class="px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in paymentHistory.slice(0, 5)" :key="payment.id" class="border-b border-blue-100">
                    <td class="px-2 py-1">{{ formatDate(payment.date) }}</td>
                    <td class="px-2 py-1">{{ payment.bank }}</td>
                    <td class="px-2 py-1">{{ payment.ref || '-' }}</td>
                    <td class="px-2 py-1 text-right">{{ formatAmount(payment.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Payment Entry Form -->
        <div v-if="selectedStudent">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Entry</h2>
          <form @submit.prevent="submitPayment" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Bank Selection -->
              <div>
                <label for="bank" class="block text-sm font-medium text-gray-700 mb-2">
                  Bank *
                </label>
                <select
                  id="bank"
                  v-model="paymentForm.bank"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="handleBankChange"
                >
                  <option value="">Select Bank</option>
                  <option v-for="bank in bankTypes" :key="bank.id" :value="bank.id">
                    {{ bank.name }} ({{ bank.format }})
                  </option>
                </select>
              </div>

              <!-- Reference Number -->
              <div>
                <label for="reference" class="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                  <span v-if="!isAdminUser" class="text-red-500">*</span>
                  <span v-if="paymentForm.bank" class="text-xs text-gray-500">
                    ({{ getBankFormat(paymentForm.bank) }})
                  </span>
                </label>
                <input
                  id="reference"
                  v-model="paymentForm.ref"
                  type="text"
                  :required="!isAdminUser"
                  :placeholder="getReferencePlaceholder()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="{ 'border-red-300': referenceError }"
                  @input="handleReferenceInput"
                />
                <div v-if="referenceError" class="mt-1 text-sm text-red-600">
                  {{ referenceError }}
                </div>
                <div v-if="duplicateWarning" class="mt-1 text-sm text-orange-600">
                  {{ duplicateWarning }}
                </div>
              </div>

              <!-- Payment Date -->
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  id="date"
                  v-model="paymentForm.date"
                  type="date"
                  required
                  :max="today"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Amount -->
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid (KSh) *
                </label>
                <input
                  id="amount"
                  v-model="paymentForm.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Balance Calculation -->
            <div v-if="paymentForm.amount && selectedStudent" class="bg-gray-50 rounded-md p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Payment Summary</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Current Balance:</span>
                  <span :class="selectedStudent.balance > 0 ? 'text-red-600' : 'text-green-600'">
                    KSh {{ formatAmount(selectedStudent.balance) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>Payment Amount:</span>
                  <span class="text-blue-600">KSh {{ formatAmount(parseFloat(paymentForm.amount) || 0) }}</span>
                </div>
                <div class="flex justify-between font-medium border-t pt-1">
                  <span>New Balance:</span>
                  <span :class="newBalance > 0 ? 'text-red-600' : 'text-green-600'">
                    KSh {{ formatAmount(newBalance) }}
                  </span>
                </div>
                <div v-if="newBalance < 0" class="text-sm text-orange-600 mt-2">
                  ⚠️ This payment will create an overpayment of KSh {{ formatAmount(Math.abs(newBalance)) }}
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex space-x-3">
              <button
                type="submit"
                :disabled="!canSubmit || submitting"
                :class="[
                  'flex-1 px-4 py-2 rounded-md font-medium transition-colors',
                  canSubmit && !submitting
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                {{ submitting ? 'Processing...' : 'Record Payment' }}
              </button>
              <button
                type="button"
                @click="clearForm"
                class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>

        <!-- No Student Selected -->
        <div v-else class="text-center py-8 text-gray-500">
        </div>
      </div>

      <!-- Success Modal -->
      <div v-if="showSuccessModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeSuccessModal">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
          <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Payment Recorded Successfully</h3>
            <div class="mt-4 text-sm text-gray-600">
              <p>Payment ID: {{ lastPayment?.id }}</p>
              <p>Amount: KSh {{ formatAmount(lastPayment?.amount || 0) }}</p>
              <p>New Balance: KSh {{ formatAmount(lastPayment?.newBalance || 0) }}</p>
            </div>
            <div class="mt-6">
              <button
                @click="closeSuccessModal"
                class="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Modal -->
      <div v-if="showErrorModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeErrorModal">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
          <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Payment Error</h3>
            <div class="mt-4 text-sm text-gray-600">
              <p>{{ errorMessage }}</p>
            </div>
            <div class="mt-6">
              <button
                @click="closeErrorModal"
                class="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface Student {
  adm: number
  name1: string
  name2: string
  name3?: string
  balance: number
  class: number
  paycount: number
  class_name?: string
}

interface PaymentHistory {
  id: number
  bank: string
  ref?: string
  amount: number
  date: string
  balance: number
}

interface BankType {
  id: string
  name: string
  format: string
}

const authStore = useAuthStore()

// Search timeout for debouncing
let searchTimeout: NodeJS.Timeout | null = null

const searchQuery = ref('')
const selectedStudent = ref<Student | null>(null)
const paymentHistory = ref<PaymentHistory[]>([])
const bankTypes = ref<BankType[]>([])
const submitting = ref(false)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const lastPayment = ref<any>(null)
const referenceError = ref('')
const duplicateWarning = ref('')
const showDropdown = ref(false)
const searchResults = ref<Student[]>([])
const isSearching = ref(false)

const paymentForm = ref({
  bank: '',
  ref: '',
  date: new Date().toISOString().split('T')[0],
  amount: ''
})

const today = new Date().toISOString().split('T')[0]

const isAdminUser = computed(() => {
  const username = authStore.userName?.toLowerCase()
  return ['peter', 'jane', 'admin'].includes(username || '')
})

const newBalance = computed(() => {
  if (!selectedStudent.value || !paymentForm.value.amount) return 0
  return selectedStudent.value.balance - parseFloat(paymentForm.value.amount)
})

const canSubmit = computed(() => {
  return selectedStudent.value &&
         paymentForm.value.bank &&
         paymentForm.value.date &&
         paymentForm.value.amount &&
         parseFloat(paymentForm.value.amount) > 0 &&
         !referenceError.value &&
         (paymentForm.value.ref || isAdminUser.value)
})

onMounted(async () => {
  await loadBankTypes()
})

const loadBankTypes = async () => {
  try {
    const response = await api.get<BankType[]>('/manual-fees/bank-types')
    if (response.success && response.data) {
      bankTypes.value = response.data
    }
  } catch (error) {
    console.error('Failed to load bank types:', error)
  }
}

const handleSearch = () => {
  // Clear previous selection when typing
  if (selectedStudent.value) {
    selectedStudent.value = null
    paymentHistory.value = []
  }
  
  // Debounce search
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = []
      showDropdown.value = false
      return
    }
    
    isSearching.value = true
    showDropdown.value = true
    
    try {
      const response = await api.get<Student[]>('/manual-fees/students/search?query=' + encodeURIComponent(searchQuery.value.trim()))
      
      if (response.success && response.data) {
        searchResults.value = response.data
      } else {
        searchResults.value = []
      }
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const hideDropdown = () => {
  // Delay hiding to allow for click events
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

const selectStudent = async (student: Student) => {
  showDropdown.value = false
  searchResults.value = []
  
  try {
    const response = await api.get<{ student: Student; paymentHistory: PaymentHistory[] }>(`/manual-fees/students/${student.adm}`)
    
    if (response.success && response.data) {
      selectedStudent.value = response.data.student
      paymentHistory.value = response.data.paymentHistory
      searchQuery.value = `${student.adm} - ${response.data.student.name1} ${response.data.student.name2} ${response.data.student.name3 || ''}`.trim()
    }
  } catch (error) {
    console.error('Failed to get student details:', error)
    errorMessage.value = 'Failed to load student details'
    showErrorModal.value = true
  }
}

const handleReferenceInput = () => {
  // Clear errors immediately when user starts typing
  referenceError.value = ''
  duplicateWarning.value = ''
  
  // Debounce validation
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    validateReference()
  }, 500) // Wait 500ms after user stops typing
}

const handleBankChange = () => {
  paymentForm.value.ref = ''
  referenceError.value = ''
  duplicateWarning.value = ''
  
  // Clear any pending validation timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
}

const getBankFormat = (bankId: string) => {
  const bank = bankTypes.value.find(b => b.id === bankId)
  return bank?.format || ''
}

const getReferencePlaceholder = () => {
  if (!paymentForm.value.bank) return 'Select bank first'
  
  const formats: Record<string, string> = {
    EQUITY: '123456789012',
    KCB: '123456789012', 
    CHEQUE: 'ABC123',
    NCBA: '1234567890123',
    BANK_OF_AFRICA: '1234567',
    SIM_PAY: '1234567890'
  }
  
  return formats[paymentForm.value.bank] || ''
}

const validateReference = async () => {
  if (!paymentForm.value.ref || !paymentForm.value.bank) {
    referenceError.value = ''
    duplicateWarning.value = ''
    return
  }

  try {
    const response = await api.post<{ valid: boolean; errors: string[] }>('/manual-fees/validate-reference', {
      bank: paymentForm.value.bank,
      ref: paymentForm.value.ref.trim()
    })

    if (response.success && response.data) {
      if (!response.data.valid) {
        referenceError.value = response.data.errors.join(', ')
      } else {
        referenceError.value = ''
      }
    }

    // Check for duplicates
    if (selectedStudent.value && paymentForm.value.ref.trim()) {
      const duplicateResponse = await api.get(`/manual-fees/check-duplicate?adm=${selectedStudent.value.adm}&ref=${encodeURIComponent(paymentForm.value.ref.trim())}&bank=${paymentForm.value.bank}`)

      if (duplicateResponse.success && duplicateResponse.data) {
        if ((duplicateResponse.data as any).isDuplicate) {
          if (paymentForm.value.bank === 'CHEQUE') {
            duplicateWarning.value = 'This reference exists for this student (allowed for cheques)'
          } else {
            referenceError.value = 'This reference number already exists'
          }
        } else {
          duplicateWarning.value = ''
        }
      }
    }
  } catch (error) {
    console.error('Reference validation failed:', error)
  }
}

const submitPayment = async () => {
  if (!canSubmit.value || !selectedStudent.value) return

  submitting.value = true
  try {
    const response = await api.post<any>('/manual-fees/payments', {
      adm: selectedStudent.value.adm,
      bank: paymentForm.value.bank,
      ref: paymentForm.value.ref || undefined,
      amount: parseFloat(paymentForm.value.amount),
      date: paymentForm.value.date
    })

    if (response.success && response.data) {
      lastPayment.value = response.data
      showSuccessModal.value = true
      
      // Update student balance
      selectedStudent.value.balance = response.data.newBalance
      
      // Clear form
      clearForm()
    }
  } catch (error: any) {
    console.error('Payment submission failed:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to record payment'
    showErrorModal.value = true
  } finally {
    submitting.value = false
  }
}

const clearForm = () => {
  paymentForm.value = {
    bank: '',
    ref: '',
    date: new Date().toISOString().split('T')[0],
    amount: ''
  }
  referenceError.value = ''
  duplicateWarning.value = ''
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  lastPayment.value = null
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorMessage.value = ''
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-KE')
}
</script>