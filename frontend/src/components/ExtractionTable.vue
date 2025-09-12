<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Extracted Payment Data</h3>
          <p class="text-sm text-gray-500 mt-1">
            Review and edit the extracted information before proceeding
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">
            {{ validRecords }}/{{ totalRecords }} valid
          </span>
          <button
            @click="validateAll"
            class="btn-secondary text-sm"
            :disabled="isValidating"
          >
            <CheckCircleIcon class="h-4 w-4 mr-1" />
            Validate All
          </button>
        </div>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="table-header w-12">#</th>
            <th class="table-header">Amount</th>
            <th class="table-header">Transaction Ref</th>
            <th class="table-header">Student Name</th>
            <th class="table-header">Class</th>
            <th class="table-header">Confidence</th>
            <th class="table-header">Status</th>
            <th class="table-header w-20">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(record, index) in localData"
            :key="record.id"
            :class="[
              'hover:bg-gray-50',
              getRowStatusClass(record)
            ]"
          >
            <!-- Row Number -->
            <td class="table-cell text-center font-medium">
              {{ index + 1 }}
            </td>
            
            <!-- Amount -->
            <td class="table-cell">
              <div class="relative">
                <input
                  v-model.number="record.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  :class="[
                    'w-full px-2 py-1 text-sm border rounded',
                    getFieldClass('amount', record)
                  ]"
                  @input="handleFieldChange(record, 'amount')"
                  @blur="validateRecord(record)"
                />
                <span class="absolute left-2 top-1 text-xs text-gray-400">KSh</span>
              </div>
            </td>
            
            <!-- Transaction Reference -->
            <td class="table-cell">
              <input
                v-model="record.transactionRef"
                type="text"
                :class="[
                  'w-full px-2 py-1 text-sm border rounded',
                  getFieldClass('transactionRef', record)
                ]"
                @input="handleFieldChange(record, 'transactionRef')"
                @blur="validateRecord(record)"
              />
            </td>
            
            <!-- Student Name -->
            <td class="table-cell">
              <input
                v-model="record.studentName"
                type="text"
                :class="[
                  'w-full px-2 py-1 text-sm border rounded',
                  getFieldClass('studentName', record)
                ]"
                @input="handleFieldChange(record, 'studentName')"
                @blur="validateRecord(record)"
              />
            </td>
            
            <!-- Class Name -->
            <td class="table-cell">
              <input
                v-model="record.className"
                type="text"
                :class="[
                  'w-full px-2 py-1 text-sm border rounded',
                  getFieldClass('className', record)
                ]"
                @input="handleFieldChange(record, 'className')"
                @blur="validateRecord(record)"
              />
            </td>
            
            <!-- Confidence -->
            <td class="table-cell">
              <div class="flex items-center space-x-2">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    :class="[
                      'h-2 rounded-full transition-all duration-300',
                      getConfidenceColor(record.confidence)
                    ]"
                    :style="{ width: `${record.confidence * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 w-8">
                  {{ Math.round(record.confidence * 100) }}%
                </span>
              </div>
            </td>
            
            <!-- Status -->
            <td class="table-cell">
              <span :class="getStatusBadgeClass(record)">
                {{ getStatusText(record) }}
              </span>
            </td>
            
            <!-- Actions -->
            <td class="table-cell">
              <div class="flex items-center space-x-1">
                <button
                  @click="duplicateRecord(record)"
                  class="text-gray-400 hover:text-gray-600"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon class="h-4 w-4" />
                </button>
                <button
                  @click="deleteRecord(record.id)"
                  class="text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Empty State -->
    <div v-if="localData.length === 0" class="text-center py-12">
      <DocumentTextIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500">No payment data extracted</p>
    </div>
    
    <!-- Table Footer -->
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="addNewRecord"
            class="btn-secondary text-sm"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Add Record
          </button>
          
          <div class="text-sm text-gray-600">
            Total Amount: <span class="font-medium">KSh {{ totalAmount.toLocaleString() }}</span>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="resetChanges"
            class="btn-secondary text-sm"
            :disabled="!hasChanges"
          >
            Reset Changes
          </button>
          
          <button
            @click="confirmData"
            class="btn-primary text-sm"
            :disabled="!canConfirm"
          >
            <CheckIcon class="h-4 w-4 mr-1" />
            Confirm Data
          </button>
        </div>
      </div>
    </div>
    
    <!-- Validation Summary -->
    <div v-if="validationSummary" class="px-6 py-4 border-t border-gray-200">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-yellow-800">Validation Issues</h4>
            <div class="mt-2 text-sm text-yellow-700">
              <ul class="list-disc list-inside space-y-1">
                <li v-for="issue in validationSummary.issues" :key="issue">
                  {{ issue }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ExtractedPayment } from '@/types'
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  DocumentTextIcon,
  PlusIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  data: ExtractedPayment[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  dataChanged: [data: ExtractedPayment[]]
  dataConfirmed: [data: ExtractedPayment[]]
}>()

// State
const localData = ref<ExtractedPayment[]>([...props.data])
const originalData = ref<ExtractedPayment[]>([...props.data])
const isValidating = ref(false)
const validationSummary = ref<{ issues: string[] } | null>(null)
const recordValidation = ref<Record<string, { valid: boolean; errors: string[] }>>({})

// Computed
const totalRecords = computed(() => localData.value.length)
const validRecords = computed(() => 
  localData.value.filter(record => recordValidation.value[record.id]?.valid !== false).length
)
const totalAmount = computed(() => 
  localData.value.reduce((sum, record) => sum + (record.amount || 0), 0)
)
const hasChanges = computed(() => 
  JSON.stringify(localData.value) !== JSON.stringify(originalData.value)
)
const canConfirm = computed(() => 
  localData.value.length > 0 && validRecords.value === totalRecords.value
)

// Methods
const handleFieldChange = (record: ExtractedPayment, field: keyof ExtractedPayment) => {
  record.isEdited = true
  emit('dataChanged', localData.value)
}

const validateRecord = (record: ExtractedPayment) => {
  const errors: string[] = []
  
  if (!record.amount || record.amount <= 0) {
    errors.push('Amount must be positive')
  }
  
  if (!record.transactionRef?.trim()) {
    errors.push('Transaction reference is required')
  }
  
  if (!record.studentName?.trim()) {
    errors.push('Student name is required')
  }
  
  if (!record.className?.trim()) {
    errors.push('Class name is required')
  }
  
  recordValidation.value[record.id] = {
    valid: errors.length === 0,
    errors
  }
}

const validateAll = async () => {
  isValidating.value = true
  
  try {
    localData.value.forEach(record => validateRecord(record))
    
    const allIssues: string[] = []
    Object.values(recordValidation.value).forEach(validation => {
      allIssues.push(...validation.errors)
    })
    
    validationSummary.value = allIssues.length > 0 ? { issues: allIssues } : null
  } finally {
    isValidating.value = false
  }
}

const addNewRecord = () => {
  const newRecord: ExtractedPayment = {
    id: `new-${Date.now()}`,
    amount: 0,
    transactionRef: '',
    studentName: '',
    className: '',
    confidence: 0,
    isEdited: true
  }
  
  localData.value.push(newRecord)
  emit('dataChanged', localData.value)
}

const duplicateRecord = (record: ExtractedPayment) => {
  const duplicated: ExtractedPayment = {
    ...record,
    id: `dup-${Date.now()}`,
    isEdited: true
  }
  
  const index = localData.value.findIndex(r => r.id === record.id)
  localData.value.splice(index + 1, 0, duplicated)
  emit('dataChanged', localData.value)
}

const deleteRecord = (id: string) => {
  localData.value = localData.value.filter(record => record.id !== id)
  delete recordValidation.value[id]
  emit('dataChanged', localData.value)
}

const resetChanges = () => {
  localData.value = [...originalData.value]
  recordValidation.value = {}
  validationSummary.value = null
  emit('dataChanged', localData.value)
}

const confirmData = () => {
  if (canConfirm.value) {
    emit('dataConfirmed', localData.value)
  }
}

// Styling methods
const getRowStatusClass = (record: ExtractedPayment) => {
  const validation = recordValidation.value[record.id]
  if (validation?.valid === false) return 'bg-red-50'
  if (record.isEdited) return 'bg-blue-50'
  return ''
}

const getFieldClass = (field: keyof ExtractedPayment, record: ExtractedPayment) => {
  const validation = recordValidation.value[record.id]
  const hasError = validation?.errors.some(error => 
    error.toLowerCase().includes(field.toLowerCase())
  )
  
  if (hasError) return 'border-red-300 focus:border-red-500 focus:ring-red-500'
  if (record.isEdited) return 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
  return 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500'
  if (confidence >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getStatusText = (record: ExtractedPayment) => {
  const validation = recordValidation.value[record.id]
  if (validation?.valid === false) return 'Invalid'
  if (record.isEdited) return 'Edited'
  return 'Valid'
}

const getStatusBadgeClass = (record: ExtractedPayment) => {
  const validation = recordValidation.value[record.id]
  if (validation?.valid === false) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
  }
  if (record.isEdited) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
  }
  return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
}

// Watch for prop changes
watch(() => props.data, (newData) => {
  localData.value = [...newData]
  originalData.value = [...newData]
  recordValidation.value = {}
  validationSummary.value = null
}, { deep: true })

// Initial validation
validateAll()
</script>