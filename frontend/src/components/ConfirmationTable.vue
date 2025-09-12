<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Payment Confirmation</h3>
          <p class="text-sm text-gray-500 mt-1">
            Review all payment details before processing
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">
            {{ readyCount }}/{{ totalRecords }} ready to process
          </span>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <div class="text-2xl font-bold text-gray-900">{{ totalRecords }}</div>
          <div class="text-sm text-gray-500">Total Payments</div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <div class="text-2xl font-bold text-green-600">{{ matchedCount }}</div>
          <div class="text-sm text-gray-500">Matched</div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <div class="text-2xl font-bold text-red-600">{{ unmatchedCount }}</div>
          <div class="text-sm text-gray-500">Unmatched</div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <div class="text-2xl font-bold text-primary-600">KSh {{ totalAmount.toLocaleString() }}</div>
          <div class="text-sm text-gray-500">Total Amount</div>
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
                :checked="allSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th class="table-header">Payment Details</th>
            <th class="table-header">Student Match</th>
            <th class="table-header">Current Balance</th>
            <th class="table-header">New Balance</th>
            <th class="table-header">Status</th>
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="record in paymentRecords"
            :key="record.extractedPayment.id"
            :class="[
              'hover:bg-gray-50',
              getRowStatusClass(record)
            ]"
          >
            <!-- Selection Checkbox -->
            <td class="table-cell">
              <input
                type="checkbox"
                :checked="selectedRecords.includes(record.extractedPayment.id)"
                @change="toggleRecordSelection(record.extractedPayment.id)"
                :disabled="!record.isMatched"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
              />
            </td>
            
            <!-- Payment Details -->
            <td class="table-cell">
              <div class="space-y-1">
                <div class="font-medium text-gray-900">
                  KSh {{ record.extractedPayment.amount.toLocaleString() }}
                </div>
                <div class="text-sm text-gray-500">
                  Ref: {{ record.extractedPayment.transactionRef }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ record.extractedPayment.studentName }} ({{ record.extractedPayment.className }})
                </div>
              </div>
            </td>
            
            <!-- Student Match -->
            <td class="table-cell">
              <div v-if="record.matchedStudent" class="space-y-1">
                <div class="font-medium text-gray-900">
                  {{ record.matchedStudent.name1 }} {{ record.matchedStudent.name2 }} {{ record.matchedStudent.name3 || '' }}
                </div>
                <div class="text-sm text-gray-500">
                  ADM: {{ record.matchedStudent.adm }} | Class {{ record.matchedStudent.class }}
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      :class="[
                        'h-1.5 rounded-full',
                        getConfidenceColor(record.matchedStudent.matchConfidence)
                      ]"
                      :style="{ width: `${record.matchedStudent.matchConfidence * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">
                    {{ Math.round(record.matchedStudent.matchConfidence * 100) }}%
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  No Match
                </span>
              </div>
            </td>
            
            <!-- Current Balance -->
            <td class="table-cell">
              <div v-if="record.matchedStudent" class="text-right">
                <div class="font-medium text-gray-900">
                  KSh {{ record.matchedStudent.currentBalance.toLocaleString() }}
                </div>
              </div>
              <div v-else class="text-center text-gray-400">-</div>
            </td>
            
            <!-- New Balance -->
            <td class="table-cell">
              <div v-if="record.isMatched" class="text-right">
                <div :class="[
                  'font-medium',
                  record.newBalance < 0 ? 'text-red-600' : 'text-green-600'
                ]">
                  KSh {{ record.newBalance.toLocaleString() }}
                </div>
                <div v-if="record.overpayment && record.overpayment > 0" class="text-xs text-orange-600">
                  Overpayment: KSh {{ record.overpayment.toLocaleString() }}
                </div>
              </div>
              <div v-else class="text-center text-gray-400">-</div>
            </td>
            
            <!-- Status -->
            <td class="table-cell">
              <span :class="getStatusBadgeClass(record)">
                {{ getStatusText(record) }}
              </span>
            </td>
            
            <!-- Actions -->
            <td class="table-cell">
              <div class="flex items-center space-x-2">
                <button
                  v-if="!record.isMatched"
                  @click="findMatch(record)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Find Match
                </button>
                <button
                  v-if="record.isMatched"
                  @click="changeMatch(record)"
                  class="text-gray-600 hover:text-gray-700 text-sm font-medium"
                >
                  Change
                </button>
                <button
                  @click="removeRecord(record.extractedPayment.id)"
                  class="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Empty State -->
    <div v-if="paymentRecords.length === 0" class="text-center py-12">
      <DocumentTextIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500">No payment records to confirm</p>
    </div>
    
    <!-- Processing Status -->
    <div v-if="isProcessing" class="px-6 py-4 border-t border-gray-200 bg-blue-50">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        <div>
          <div class="text-sm font-medium text-blue-900">Processing Payments...</div>
          <div class="text-xs text-blue-700">
            Processing {{ selectedRecords.length }} payments. This may take several minutes for large batches.
          </div>
        </div>
      </div>
      <div class="mt-2 bg-blue-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: 30%"
        ></div>
      </div>
      <div class="mt-2 text-xs text-blue-600">
        Please do not close this window while processing is in progress.
      </div>
    </div>
    
    <!-- Actions Footer -->
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-600">
            {{ selectedRecords.length }} of {{ readyCount }} payments selected
          </div>
          <div class="text-sm text-gray-600">
            Selected Amount: <span class="font-medium">KSh {{ selectedAmount.toLocaleString() }}</span>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="validateBatch"
            class="btn-secondary text-sm"
            :disabled="selectedRecords.length === 0 || isProcessing"
          >
            <CheckCircleIcon class="h-4 w-4 mr-1" />
            Validate Batch
          </button>
          
          <button
            @click="processBatch"
            class="btn-primary text-sm"
            :disabled="selectedRecords.length === 0 || isProcessing || !batchValidated"
          >
            <CreditCardIcon class="h-4 w-4 mr-1" />
            {{ isProcessing ? 'Processing...' : 'Process Payments' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Validation Results -->
    <div v-if="validationResults" class="px-6 py-4 border-t border-gray-200">
      <div :class="[
        'rounded-lg p-4',
        validationResults.batchValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      ]">
        <div class="flex">
          <CheckCircleIcon v-if="validationResults.batchValid" class="h-5 w-5 text-green-400" />
          <ExclamationTriangleIcon v-else class="h-5 w-5 text-yellow-400" />
          <div class="ml-3">
            <h4 :class="[
              'text-sm font-medium',
              validationResults.batchValid ? 'text-green-800' : 'text-yellow-800'
            ]">
              {{ validationResults.batchValid ? 'Batch Validation Passed' : 'Validation Issues Found' }}
            </h4>
            <div :class="[
              'mt-2 text-sm',
              validationResults.batchValid ? 'text-green-700' : 'text-yellow-700'
            ]">
              <p>{{ validationResults.validRecords }} valid, {{ validationResults.invalidRecords }} invalid</p>
              <div v-if="validationResults.validationResults.length > 0" class="mt-2">
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="result in validationResults.validationResults" :key="result.paymentId">
                    Payment {{ result.paymentId }}: {{ result.errors.join(', ') }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Manual Search Modal -->
    <ManualSearchModal
      v-if="showManualSearch"
      :payment="selectedPaymentForSearch"
      @student-selected="handleManualSelection"
      @close="closeManualSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { paymentApi } from '@/services/api'
import { useToast } from 'vue-toastification'
import type { ExtractedPayment, StudentMatch, PaymentRecord } from '@/types'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon
} from '@heroicons/vue/24/outline'
import ManualSearchModal from './ManualSearchModal.vue'

// Props
interface Props {
  paymentRecords: PaymentRecord[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  recordsUpdated: [records: PaymentRecord[]]
  processingComplete: [results: any]
}>()

// State
const toast = useToast()
const selectedRecords = ref<string[]>([])
const isProcessing = ref(false)
const processedCount = ref(0)
const batchValidated = ref(false)
const validationResults = ref<any>(null)
const showManualSearch = ref(false)
const selectedPaymentForSearch = ref<ExtractedPayment | null>(null)

// Computed
const totalRecords = computed(() => props.paymentRecords.length)
const matchedCount = computed(() => props.paymentRecords.filter(r => r.isMatched).length)
const unmatchedCount = computed(() => props.paymentRecords.filter(r => !r.isMatched).length)
const readyCount = computed(() => props.paymentRecords.filter(r => r.isMatched).length)
const totalAmount = computed(() => 
  props.paymentRecords.reduce((sum, r) => sum + r.extractedPayment.amount, 0)
)
const selectedAmount = computed(() => {
  const selectedPayments = props.paymentRecords.filter(r => 
    selectedRecords.value.includes(r.extractedPayment.id)
  )
  return selectedPayments.reduce((sum, r) => sum + r.extractedPayment.amount, 0)
})
const allSelected = computed(() => {
  const readyRecords = props.paymentRecords.filter(r => r.isMatched)
  return readyRecords.length > 0 && readyRecords.every(r => 
    selectedRecords.value.includes(r.extractedPayment.id)
  )
})

// Methods
const toggleSelectAll = () => {
  const readyRecords = props.paymentRecords.filter(r => r.isMatched)
  
  if (allSelected.value) {
    selectedRecords.value = selectedRecords.value.filter(id => 
      !readyRecords.some(r => r.extractedPayment.id === id)
    )
  } else {
    const newSelections = readyRecords
      .filter(r => !selectedRecords.value.includes(r.extractedPayment.id))
      .map(r => r.extractedPayment.id)
    selectedRecords.value.push(...newSelections)
  }
}

const toggleRecordSelection = (paymentId: string) => {
  const index = selectedRecords.value.indexOf(paymentId)
  if (index > -1) {
    selectedRecords.value.splice(index, 1)
  } else {
    selectedRecords.value.push(paymentId)
  }
}

const validateBatch = async () => {
  const selectedPaymentRecords = props.paymentRecords.filter(r => 
    selectedRecords.value.includes(r.extractedPayment.id)
  )
  
  if (selectedPaymentRecords.length === 0) {
    toast.warning('Please select payments to validate')
    return
  }
  
  try {
    const response = await paymentApi.validateBatch(selectedPaymentRecords)
    
    if (response.success && response.data) {
      const data = response.data as any
      validationResults.value = data
      batchValidated.value = data.batchValid || false
      
      if (data.batchValid) {
        toast.success('Batch validation passed')
      } else {
        toast.warning(`Validation issues found: ${data.invalidRecords || 0} invalid records`)
      }
    } else {
      throw new Error(response.error?.message || 'Validation failed')
    }
  } catch (error) {
    console.error('Validation error:', error)
    toast.error('Failed to validate batch')
  }
}

const processBatch = async () => {
  if (!batchValidated.value) {
    toast.warning('Please validate the batch first')
    return
  }
  
  const selectedPaymentRecords = props.paymentRecords.filter(r => 
    selectedRecords.value.includes(r.extractedPayment.id)
  )
  
  if (selectedPaymentRecords.length === 0) {
    toast.warning('Please select payments to process')
    return
  }
  
  isProcessing.value = true
  processedCount.value = 0
  
  // Show initial processing message
  toast.info(`Starting to process ${selectedPaymentRecords.length} payments. This may take a few minutes...`)
  
  try {
    const response = await paymentApi.processBatch(selectedPaymentRecords, true)
    
    if (response.success && response.data) {
      const data = response.data as any
      processedCount.value = data.processedCount || selectedPaymentRecords.length
      
      toast.success(`Successfully processed ${data.processedCount || selectedPaymentRecords.length} payments`)
      emit('processingComplete', data)
      
      // Clear selections
      selectedRecords.value = []
      batchValidated.value = false
      validationResults.value = null
    } else {
      throw new Error(response.error?.message || 'Processing failed')
    }
  } catch (error: any) {
    console.error('Processing error:', error)
    
    // Provide specific error messages based on error type
    if (error.message?.includes('timeout')) {
      toast.error('Processing is taking longer than expected. Please check the payment history to see if payments were processed.')
    } else if (error.response?.status === 500) {
      toast.error('Server error during processing. Please check payment history and try again if needed.')
    } else {
      toast.error(`Failed to process payments: ${error.message || 'Unknown error'}`)
    }
  } finally {
    isProcessing.value = false
  }
}

const findMatch = (record: PaymentRecord) => {
  selectedPaymentForSearch.value = record.extractedPayment
  showManualSearch.value = true
}

const changeMatch = (record: PaymentRecord) => {
  selectedPaymentForSearch.value = record.extractedPayment
  showManualSearch.value = true
}

const closeManualSearch = () => {
  showManualSearch.value = false
  selectedPaymentForSearch.value = null
}

const handleManualSelection = (student: StudentMatch) => {
  if (selectedPaymentForSearch.value) {
    const recordIndex = props.paymentRecords.findIndex(r => 
      r.extractedPayment.id === selectedPaymentForSearch.value!.id
    )
    
    if (recordIndex > -1) {
      const updatedRecords = [...props.paymentRecords]
      updatedRecords[recordIndex] = {
        ...updatedRecords[recordIndex],
        matchedStudent: student,
        isMatched: true,
        newBalance: student.currentBalance - selectedPaymentForSearch.value.amount,
        overpayment: Math.max(0, selectedPaymentForSearch.value.amount - student.currentBalance),
        status: 'pending'
      }
      
      emit('recordsUpdated', updatedRecords)
    }
  }
  
  closeManualSearch()
}

const removeRecord = (paymentId: string) => {
  const updatedRecords = props.paymentRecords.filter(r => 
    r.extractedPayment.id !== paymentId
  )
  
  // Remove from selections if selected
  const selectionIndex = selectedRecords.value.indexOf(paymentId)
  if (selectionIndex > -1) {
    selectedRecords.value.splice(selectionIndex, 1)
  }
  
  emit('recordsUpdated', updatedRecords)
}

// Styling methods
const getRowStatusClass = (record: PaymentRecord) => {
  if (!record.isMatched) return 'bg-red-50'
  if (record.overpayment && record.overpayment > 0) return 'bg-orange-50'
  return ''
}

const getStatusBadgeClass = (record: PaymentRecord) => {
  if (!record.isMatched) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
  }
  if (record.overpayment && record.overpayment > 0) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800'
  }
  return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
}

const getStatusText = (record: PaymentRecord) => {
  if (!record.isMatched) return 'Unmatched'
  if (record.overpayment && record.overpayment > 0) return 'Overpayment'
  return 'Ready'
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500'
  if (confidence >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>