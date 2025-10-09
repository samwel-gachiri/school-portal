<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Payment Details</h2>
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-700">Batch Mode</label>
        <button
          @click="toggleBatchMode"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            batchMode ? 'bg-blue-600' : 'bg-gray-200'
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              batchMode ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
      </div>
    </div>

    <form @submit.prevent="submitPayment" class="space-y-4">
      <!-- Student Info Display -->
      <div v-if="student" class="bg-gray-50 rounded-md p-4">
        <h3 class="text-sm font-medium text-gray-900 mb-2">Student Information</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Name:</span>
            <span class="ml-2 font-medium">{{ student.full_name }}</span>
          </div>
          <div>
            <span class="text-gray-600">Admission No:</span>
            <span class="ml-2 font-medium">{{ student.admission_number }}</span>
          </div>
          <div>
            <span class="text-gray-600">Class:</span>
            <span class="ml-2 font-medium">{{ student.class }}</span>
          </div>
          <div>
            <span class="text-gray-600">Current Balance:</span>
            <span class="ml-2 font-medium" :class="student.current_balance > 0 ? 'text-red-600' : 'text-green-600'">
              KSh {{ formatAmount(student.current_balance) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Fee Type -->
      <div>
        <label for="feeType" class="block text-sm font-medium text-gray-700 mb-2">
          Fee Type *
        </label>
        <select
          id="feeType"
          v-model="form.feeType"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select fee type</option>
          <option v-for="feeType in feeTypes" :key="feeType.id" :value="feeType.id">
            {{ feeType.name }} - {{ feeType.description }}
          </option>
        </select>
      </div>

      <!-- Amount -->
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount (KSh) *
        </label>
        <input
          id="amount"
          v-model="form.amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div v-if="student && form.amount" class="mt-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Current Balance:</span>
            <span :class="student.current_balance > 0 ? 'text-red-600' : 'text-green-600'">
              KSh {{ formatAmount(student.current_balance) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Payment Amount:</span>
            <span class="text-blue-600">KSh {{ formatAmount(parseFloat(form.amount) || 0) }}</span>
          </div>
          <div class="flex justify-between font-medium border-t pt-1">
            <span class="text-gray-900">New Balance:</span>
            <span :class="newBalance > 0 ? 'text-red-600' : 'text-green-600'">
              KSh {{ formatAmount(newBalance) }}
            </span>
          </div>
          <div v-if="newBalance < 0" class="text-sm text-orange-600 mt-1">
            ⚠️ This payment will create a credit balance of KSh {{ formatAmount(Math.abs(newBalance)) }}
          </div>
        </div>
      </div>

      <!-- Reference -->
      <div>
        <label for="reference" class="block text-sm font-medium text-gray-700 mb-2">
          Payment Reference
        </label>
        <input
          id="reference"
          v-model="form.reference"
          type="text"
          placeholder="e.g., Receipt #12345, Bank Ref: ABC123"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          placeholder="Additional notes about this payment..."
          maxlength="500"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
        <p class="mt-1 text-xs text-gray-500">{{ form.notes.length }}/500 characters</p>
      </div>

      <!-- Submit Button -->
      <div class="flex space-x-3">
        <button
          type="submit"
          :disabled="!canSubmit"
          :class="[
            'flex-1 px-4 py-2 rounded-md font-medium transition-colors',
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          {{ batchMode ? 'Add to Batch' : 'Process Payment' }}
        </button>
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Student {
  id: string
  admission_number: string
  full_name: string
  class: string
  current_balance: number
}

interface FeeType {
  id: string
  name: string
  description: string
}

interface Props {
  student?: Student | null
  feeTypes: FeeType[]
  batchMode: boolean
}

interface Emits {
  (e: 'payment-submitted', payment: {
    studentId: string
    amount: number
    feeType: string
    reference?: string
    notes?: string
  }): void
  (e: 'batch-mode-toggle', enabled: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  feeType: '',
  amount: '',
  reference: '',
  notes: ''
})

const canSubmit = computed(() => {
  return props.student && 
         form.value.feeType && 
         form.value.amount && 
         parseFloat(form.value.amount) > 0
})

const newBalance = computed(() => {
  if (!props.student || !form.value.amount) return 0
  return props.student.current_balance - parseFloat(form.value.amount)
})

const submitPayment = () => {
  if (!canSubmit.value || !props.student) return

  emit('payment-submitted', {
    studentId: props.student.id,
    amount: parseFloat(form.value.amount),
    feeType: form.value.feeType,
    reference: form.value.reference || undefined,
    notes: form.value.notes || undefined
  })

  resetForm()
}

const resetForm = () => {
  form.value = {
    feeType: '',
    amount: '',
    reference: '',
    notes: ''
  }
}

const toggleBatchMode = () => {
  emit('batch-mode-toggle', !props.batchMode)
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

// Reset form when student changes
watch(() => props.student, () => {
  if (!props.student) {
    resetForm()
  }
})
</script>