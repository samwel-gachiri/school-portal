<template>
  <AuthGuard>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Process Payments</h1>
        <p class="mt-2 text-gray-600">
          Review extracted data, match students, and process payments
        </p>
      </div>
      
      <!-- Progress Steps -->
      <div class="mb-8">
        <nav aria-label="Progress">
          <ol class="flex items-center">
            <li class="relative pr-8 sm:pr-20">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="h-0.5 w-full bg-primary-600"></div>
              </div>
              <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                <CheckIcon class="h-5 w-5 text-white" />
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Extract</span>
            </li>
            
            <li class="relative pr-8 sm:pr-20">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div :class="[
                  'h-0.5 w-full',
                  currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
                ]"></div>
              </div>
              <div :class="[
                'relative flex h-8 w-8 items-center justify-center rounded-full',
                currentStep >= 2 ? 'bg-primary-600' : currentStep === 1 ? 'bg-primary-600' : 'bg-gray-200'
              ]">
                <CheckIcon v-if="currentStep >= 2" class="h-5 w-5 text-white" />
                <span v-else :class="[
                  'text-sm font-medium',
                  currentStep === 1 ? 'text-white' : 'text-gray-500'
                ]">2</span>
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Match</span>
            </li>
            
            <li class="relative">
              <div :class="[
                'relative flex h-8 w-8 items-center justify-center rounded-full',
                currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'
              ]">
                <CheckIcon v-if="currentStep >= 3" class="h-5 w-5 text-white" />
                <span v-else :class="[
                  'text-sm font-medium',
                  currentStep === 2 ? 'text-white' : 'text-gray-500'
                ]">3</span>
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Confirm</span>
            </li>
          </ol>
        </nav>
      </div>

      <!-- Step 1: Review Extracted Data -->
      <div v-if="currentStep === 0" class="space-y-6">
        <ExtractionTable
          :data="extractedPayments"
          @data-changed="handleDataChanged"
          @data-confirmed="handleDataConfirmed"
        />
      </div>

      <!-- Step 2: Match Students -->
      <div v-if="currentStep === 1" class="space-y-6">
        <StudentMatcher
          :payments="confirmedPayments"
          @matching-complete="handleMatchingComplete"
        />
        
        <div class="flex justify-between">
          <button
            @click="goBack"
            class="btn-secondary"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Back to Edit Data
          </button>
        </div>
      </div>

      <!-- Step 3: Final Confirmation -->
      <div v-if="currentStep === 2" class="space-y-6">
        <ConfirmationTable
          :payment-records="paymentRecords"
          @records-updated="handleRecordsUpdated"
          @processing-complete="handleProcessingComplete"
        />
        
        <div class="flex justify-between">
          <button
            @click="goBack"
            class="btn-secondary"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Back to Matching
          </button>
        </div>
      </div>

      <!-- Step 4: Processing Complete -->
      <div v-if="currentStep === 3" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="text-center">
            <CheckCircleIcon class="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h2>
            <p class="text-gray-600 mb-6">
              Successfully processed {{ processingResults?.processedCount || 0 }} payments
            </p>
            
            <!-- Results Summary -->
            <div v-if="processingResults" class="bg-gray-50 rounded-lg p-6 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {{ processingResults.summary.successfulPayments }}
                  </div>
                  <div class="text-sm text-gray-500">Successful</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-600">
                    {{ processingResults.summary.failedPayments }}
                  </div>
                  <div class="text-sm text-gray-500">Failed</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary-600">
                    KSh {{ processingResults.summary.totalAmount.toLocaleString() }}
                  </div>
                  <div class="text-sm text-gray-500">Total Amount</div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-center space-x-4">
              <button
                @click="startOver"
                class="btn-primary"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                Process More Payments
              </button>
              <button
                @click="viewHistory"
                class="btn-secondary"
              >
                <ClockIcon class="h-4 w-4 mr-2" />
                View History
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading States -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading payment data...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <div class="mt-4">
              <button
                @click="loadData"
                class="btn-secondary text-sm"
              >
                Try Again
              </button>
              <button
                @click="$router.push('/upload')"
                class="btn-primary text-sm ml-2"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { ExtractedPayment, StudentMatch, PaymentRecord } from '@/types'
import AuthGuard from '@/components/AuthGuard.vue'
import ExtractionTable from '@/components/ExtractionTable.vue'
import StudentMatcher from '@/components/StudentMatcher.vue'
import ConfirmationTable from '@/components/ConfirmationTable.vue'
import {
  CheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const toast = useToast()

// State
const currentStep = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const extractedPayments = ref<ExtractedPayment[]>([])
const confirmedPayments = ref<ExtractedPayment[]>([])
const studentMatches = ref<Record<string, StudentMatch>>({})
const paymentRecords = ref<PaymentRecord[]>([])
const processingResults = ref<any>(null)

// Methods
const loadData = () => {
  try {
    // Load data from session storage
    const extractedData = sessionStorage.getItem('extractedData')
    const uploadedFile = sessionStorage.getItem('uploadedFile')
    
    if (!extractedData) {
      throw new Error('No extracted data found. Please start from upload.')
    }
    
    const parsedData = JSON.parse(extractedData)
    extractedPayments.value = parsedData.extractedData || []
    
    if (extractedPayments.value.length === 0) {
      throw new Error('No payment data found to process.')
    }
    
    error.value = null
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

const handleDataChanged = (data: ExtractedPayment[]) => {
  extractedPayments.value = data
}

const handleDataConfirmed = (data: ExtractedPayment[]) => {
  confirmedPayments.value = data
  currentStep.value = 1
  toast.success('Data confirmed. Proceeding to student matching.')
}

const handleMatchingComplete = (matches: Record<string, StudentMatch>) => {
  studentMatches.value = matches
  
  // Create payment records
  paymentRecords.value = confirmedPayments.value.map(payment => {
    const matchedStudent = matches[payment.id]
    const isMatched = !!matchedStudent
    
    return {
      extractedPayment: payment,
      matchedStudent,
      isMatched,
      newBalance: isMatched ? matchedStudent.currentBalance - payment.amount : 0,
      overpayment: isMatched ? Math.max(0, payment.amount - matchedStudent.currentBalance) : 0,
      status: 'pending' as const
    }
  })
  
  currentStep.value = 2
  toast.success('Student matching complete. Review and confirm payments.')
}

const handleRecordsUpdated = (records: PaymentRecord[]) => {
  paymentRecords.value = records
}

const handleProcessingComplete = (results: any) => {
  processingResults.value = results
  currentStep.value = 3
  
  // Clear session storage
  sessionStorage.removeItem('extractedData')
  sessionStorage.removeItem('uploadedFile')
}

const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const startOver = () => {
  router.push('/upload')
}

const viewHistory = () => {
  router.push('/history')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>