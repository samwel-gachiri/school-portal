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
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Enter admission number or student name..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="handleSearch"
              @focus="showDropdown = true; $event.target.select()"
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
          <div v-if="sortedPaymentHistory.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Recent Payments</h4>
            <div class="max-h-64 overflow-y-auto border border-blue-200 rounded-md">
              <table class="min-w-full text-xs">
                <thead class="bg-blue-100 text-blue-900">
                  <tr>
                    <th class="px-2 py-1.5 text-left font-semibold"># ID</th>
                    <th class="px-2 py-1.5 text-left font-semibold">Date</th>
                    <th class="px-2 py-1.5 text-left font-semibold">Bank</th>
                    <th class="px-2 py-1.5 text-left font-semibold">Reference</th>
                    <th class="px-2 py-1.5 text-right font-semibold">Amount</th>
                    <th class="px-2 py-1.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in sortedPaymentHistory" :key="payment.id" class="border-b border-blue-100 hover:bg-blue-50/50">
                    <td class="px-2 py-1 font-mono font-bold text-blue-900">{{ payment.id }}</td>
                    <td class="px-2 py-1">{{ formatDate(payment.date) }}</td>
                    <td class="px-2 py-1">{{ payment.bank }}</td>
                    <td class="px-2 py-1">{{ payment.ref || '-' }}</td>
                    <td class="px-2 py-1 text-right font-medium">{{ formatAmount(payment.amount) }}</td>
                    <td class="px-2 py-1 text-right whitespace-nowrap">
                      <button 
                        type="button" 
                        @click="openEditPaymentModal(payment)" 
                        class="text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-100 border border-blue-300 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
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
                  ref="bankInput"
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
                  ref="refInput"
                  v-model="paymentForm.ref"
                  type="text"
                  :required="!isAdminUser"
                  :placeholder="getReferencePlaceholder()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="{ 'border-red-300': referenceError }"
                  @input="handleReferenceInput"
                  @keyup.enter="dateInput?.focus()"
                />
                <!-- <div v-if="referenceError" class="mt-1 text-sm text-red-600">
                  {{ referenceError }}
                </div>
                <div v-if="duplicateWarning" class="mt-1 text-sm text-orange-600">
                  {{ duplicateWarning }}
                </div> -->
              </div>

              <!-- Payment Date -->
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  id="date"
                  ref="dateInput"
                  v-model="paymentForm.date"
                  type="date"
                  required
                  :max="today"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @keyup.enter="amountInput?.focus()"
                />
              </div>

              <!-- Amount -->
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid (KSh) *
                </label>
                <input
                  id="amount"
                  ref="amountInput"
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
      <!-- Edit Payment Modal -->
      <div v-if="showEditPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="text-left">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Edit Payment</h3>
            <p class="text-xs text-gray-500 mb-4">Update payment information, bank, reference, or amount.</p>
            <form @submit.prevent="submitEditPayment" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bank *</label>
                <select v-model="editPaymentForm.bank" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option v-for="bank in bankTypes" :key="bank.id" :value="bank.id">
                    {{ bank.name }} ({{ bank.format }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input type="text" v-model="editPaymentForm.ref" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Reference code">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KSh) *</label>
                <input type="number" v-model.number="editPaymentForm.amount" min="1" step="any" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input type="date" v-model="editPaymentForm.date" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reason for Modification *</label>
                <input type="text" v-model="editPaymentForm.reason" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. Corrected amount / reference">
              </div>
              <div class="flex space-x-2 pt-2">
                <button type="submit" :disabled="submittingPaymentEdit" class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                  {{ submittingPaymentEdit ? 'Saving...' : 'Save Changes' }}
                </button>
                <button type="button" @click="handleDeleteFromEditModal" :disabled="submittingPaymentEdit" class="px-3 py-2 bg-red-50 text-red-700 border border-red-300 text-sm font-medium rounded-md hover:bg-red-100">
                  Delete
                </button>
                <button type="button" @click="showEditPaymentModal = false" :disabled="submittingPaymentEdit" class="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Delete Payment Modal -->
      <div v-if="showDeletePaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg font-semibold text-gray-900">Delete Payment</h3>
              <div class="mt-2 text-sm text-gray-600">
                <p>Are you sure you want to delete payment of <strong class="text-red-600">KSh {{ formatAmount(paymentToDelete?.amount || 0) }}</strong>?</p>
                <p v-if="paymentToDelete?.ref" class="text-xs text-gray-500 mt-1">Ref: <span class="font-mono">{{ paymentToDelete.ref }}</span> ({{ paymentToDelete.bank }})</p>
                <div class="mt-3">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Reason for Deletion *</label>
                  <textarea 
                    v-model="deletePaymentReason" 
                    rows="2" 
                    required 
                    class="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" 
                    placeholder="e.g. Duplicate payment / entered twice"
                  ></textarea>
                </div>
                <div class="bg-amber-50 text-amber-800 text-xs p-2.5 rounded border border-amber-200 mt-3 leading-relaxed">
                  ⚠️ Deleting this payment will reverse it and restore KSh {{ formatAmount(paymentToDelete?.amount || 0) }} to the student's outstanding balance.
                </div>
              </div>
            </div>
          </div>
          <div class="mt-5 flex space-x-3 sm:flex-row-reverse sm:space-x-reverse">
            <button type="button" @click="executeDeletePayment" :disabled="deletingPayment" class="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-red-400">
              {{ deletingPayment ? 'Deleting...' : 'Confirm Delete' }}
            </button>
            <button type="button" @click="showDeletePaymentModal = false" :disabled="deletingPayment" class="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api, { manualFeesApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()

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
const sortedPaymentHistory = computed(() => {
  return [...paymentHistory.value].sort((a, b) => Number(b.id) - Number(a.id))
})
const bankTypes = ref<BankType[]>([])
const submitting = ref(false)
const showSuccessModal = ref(false)
const successMessage = ref('Payment recorded successfully')
const showErrorModal = ref(false)
const errorMessage = ref('')
const lastPayment = ref<any>(null)
const referenceError = ref('')
const duplicateWarning = ref('')
const showDropdown = ref(false)
const searchResults = ref<Student[]>([])
const isSearching = ref(false)

const showEditPaymentModal = ref(false)
const submittingPaymentEdit = ref(false)
const editingPaymentId = ref<number | null>(null)
const editPaymentForm = ref({
  bank: '',
  ref: '',
  amount: 0,
  date: '',
  reason: ''
})

const showDeletePaymentModal = ref(false)
const deletingPayment = ref(false)
const deletePaymentReason = ref('')
const paymentToDelete = ref<PaymentHistory | null>(null)
const currentEditingPayment = ref<PaymentHistory | null>(null)

const searchInput = ref<HTMLInputElement | null>(null)
const bankInput = ref<HTMLSelectElement | null>(null)
const refInput = ref<HTMLInputElement | null>(null)
const dateInput = ref<HTMLInputElement | null>(null)
const amountInput = ref<HTMLInputElement | null>(null)

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
      
      setTimeout(() => {
        bankInput.value?.focus()
      }, 50)
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
  
  if (paymentForm.value.bank) {
    setTimeout(() => {
      refInput.value?.focus()
    }, 50)
  }
}

const getBankFormat = (bankId: string) => {
  const bank = bankTypes.value.find(b => b.id === bankId)
  return bank?.format || ''
}

const getReferencePlaceholder = () => {
  if (!paymentForm.value.bank) return 'Select bank first'
  
  const formats: Record<string, string> = {
    EQUITY: 'KEahu655u1YD',
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
      
      // Update local history
      const bankName = bankTypes.value.find(b => b.id === paymentForm.value.bank)?.name || paymentForm.value.bank;
      paymentHistory.value.unshift({
        id: response.data.id || Date.now(),
        bank: bankName,
        ref: paymentForm.value.ref,
        amount: parseFloat(paymentForm.value.amount),
        date: paymentForm.value.date,
        balance: response.data.newBalance
      })
      
      // Clear ONLY payment form so user can see history
      paymentForm.value = {
        bank: '',
        ref: '',
        date: new Date().toISOString().split('T')[0],
        amount: ''
      }
      referenceError.value = ''
      duplicateWarning.value = ''
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
  selectedStudent.value = null
  paymentHistory.value = []
  searchQuery.value = ''
  setTimeout(() => {
    searchInput.value?.focus()
  }, 50)
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

const openEditPaymentModal = (payment: PaymentHistory) => {
  currentEditingPayment.value = payment
  editingPaymentId.value = payment.id
  let formattedDate = ''
  if (payment.date) {
    try {
      formattedDate = new Date(payment.date).toISOString().split('T')[0]
    } catch {
      formattedDate = payment.date
    }
  } else {
    formattedDate = new Date().toISOString().split('T')[0]
  }

  editPaymentForm.value = {
    bank: payment.bank,
    ref: payment.ref || '',
    amount: payment.amount,
    date: formattedDate,
    reason: ''
  }
  showEditPaymentModal.value = true
}

const handleDeleteFromEditModal = () => {
  if (!currentEditingPayment.value) return
  showEditPaymentModal.value = false
  confirmDeletePayment(currentEditingPayment.value)
}

const submitEditPayment = async () => {
  if (!editingPaymentId.value || !selectedStudent.value) return
  if (!editPaymentForm.value.reason?.trim()) {
    toast.warning('Please provide a reason for the modification')
    return
  }
  submittingPaymentEdit.value = true
  try {
    const payload = {
      bank: editPaymentForm.value.bank,
      ref: editPaymentForm.value.ref?.trim() || undefined,
      amount: Number(editPaymentForm.value.amount),
      date: editPaymentForm.value.date,
      reason: editPaymentForm.value.reason.trim()
    }
    const res = await manualFeesApi.updatePayment(editingPaymentId.value, payload)
    if (res.success) {
      showEditPaymentModal.value = false
      toast.success('Payment updated successfully!')
      // Refresh student details & payment history
      await selectStudent(selectedStudent.value)
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Failed to update payment'
    toast.error(msg)
  } finally {
    submittingPaymentEdit.value = false
  }
}

const confirmDeletePayment = (payment: PaymentHistory) => {
  paymentToDelete.value = payment
  deletePaymentReason.value = ''
  showDeletePaymentModal.value = true
}

const executeDeletePayment = async () => {
  if (!paymentToDelete.value || !selectedStudent.value) return
  if (!deletePaymentReason.value?.trim()) {
    toast.warning('Please provide a reason for deleting this payment')
    return
  }
  deletingPayment.value = true
  try {
    const res = await manualFeesApi.deletePayment(paymentToDelete.value.id, {
      reason: deletePaymentReason.value.trim()
    })
    if (res.success) {
      showDeletePaymentModal.value = false
      paymentToDelete.value = null
      deletePaymentReason.value = ''
      toast.success('Payment deleted successfully and balance restored!')
      // Refresh student details & payment history
      await selectStudent(selectedStudent.value)
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Failed to delete payment'
    toast.error(msg)
  } finally {
    deletingPayment.value = false
  }
}
</script>