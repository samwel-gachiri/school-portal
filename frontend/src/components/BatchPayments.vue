<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">
        Batch Payments ({{ payments.length }})
      </h2>
      <div class="text-sm text-gray-600">
        Total: KSh {{ formatAmount(totalAmount) }}
      </div>
    </div>

    <div v-if="payments.length === 0" class="text-center py-8 text-gray-500">
      <p>No payments in batch yet.</p>
      <p class="text-sm">Add payments using the form above.</p>
    </div>

    <div v-else>
      <!-- Payments Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee Type
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(payment, index) in payments" :key="index" class="hover:bg-gray-50">
              <td class="px-4 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ payment.student?.full_name || 'Unknown Student' }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ payment.student?.admission_number }} • {{ payment.student?.class }}
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ getFeeTypeName(payment.feeType) }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                KSh {{ formatAmount(payment.amount) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ payment.reference || '-' }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="removePayment(index)"
                  class="text-red-600 hover:text-red-900 focus:outline-none"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Batch Summary -->
      <div class="mt-6 bg-gray-50 rounded-md p-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-sm font-medium text-gray-900">Batch Summary</h3>
            <p class="text-sm text-gray-600">
              {{ payments.length }} payment{{ payments.length !== 1 ? 's' : '' }} 
              totaling KSh {{ formatAmount(totalAmount) }}
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="clearBatch"
              class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear All
            </button>
            <button
              @click="processBatch"
              :disabled="payments.length === 0"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                payments.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              Process Batch
            </button>
          </div>
        </div>
      </div>

      <!-- Validation Warnings -->
      <div v-if="validationWarnings.length > 0" class="mt-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Validation Warnings</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <ul class="list-disc pl-5 space-y-1">
                  <li v-for="warning in validationWarnings" :key="warning">{{ warning }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Student {
  id: string
  admission_number: string
  full_name: string
  class: string
  current_balance: number
}

interface Payment {
  studentId: string
  student?: Student
  amount: number
  feeType: string
  reference?: string
  notes?: string
}

interface Props {
  payments: Payment[]
}

interface Emits {
  (e: 'remove-payment', index: number): void
  (e: 'process-batch'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const totalAmount = computed(() => {
  return props.payments.reduce((sum, payment) => sum + payment.amount, 0)
})

const validationWarnings = computed(() => {
  const warnings: string[] = []
  
  // Check for duplicate students
  const studentIds = props.payments.map(p => p.studentId)
  const duplicates = studentIds.filter((id, index) => studentIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    warnings.push('Some students have multiple payments in this batch')
  }
  
  // Check for large amounts
  const largePayments = props.payments.filter(p => p.amount > 50000)
  if (largePayments.length > 0) {
    warnings.push(`${largePayments.length} payment(s) exceed KSh 50,000`)
  }
  
  return warnings
})

const removePayment = (index: number) => {
  emit('remove-payment', index)
}

const clearBatch = () => {
  for (let i = props.payments.length - 1; i >= 0; i--) {
    emit('remove-payment', i)
  }
}

const processBatch = () => {
  emit('process-batch')
}

const getFeeTypeName = (feeTypeId: string) => {
  const feeTypeNames: Record<string, string> = {
    tuition: 'Tuition',
    transport: 'Transport',
    meals: 'Meals',
    uniform: 'Uniform',
    books: 'Books',
    activities: 'Activities',
    examination: 'Examination',
    other: 'Other'
  }
  return feeTypeNames[feeTypeId] || feeTypeId
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
</script>