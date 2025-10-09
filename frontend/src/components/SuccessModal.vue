<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
      <div class="mt-3 text-center">
        <!-- Success Icon -->
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <!-- Title -->
        <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">
          {{ isBatchPayment ? 'Batch Processed Successfully' : 'Payment Processed Successfully' }}
        </h3>
        
        <!-- Content -->
        <div class="mt-4 text-sm text-gray-600">
          <div v-if="isBatchPayment" class="space-y-2">
            <p>{{ payment.batchResults.successful.length }} payments processed successfully</p>
            <p v-if="payment.batchResults.failed.length > 0" class="text-orange-600">
              {{ payment.batchResults.failed.length }} payments failed
            </p>
          </div>
          <div v-else class="space-y-2">
            <div class="flex justify-between">
              <span>Payment ID:</span>
              <span class="font-medium">{{ payment.id }}</span>
            </div>
            <div class="flex justify-between">
              <span>Amount:</span>
              <span class="font-medium">KSh {{ formatAmount(payment.amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span>New Balance:</span>
              <span class="font-medium" :class="payment.newBalance > 0 ? 'text-red-600' : 'text-green-600'">
                KSh {{ formatAmount(payment.newBalance) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex space-x-3 mt-6">
          <button
            v-if="!isBatchPayment"
            @click="generateReceipt"
            class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Receipt
          </button>
          <button
            @click="$emit('close')"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Payment {
  id?: string
  amount?: number
  newBalance?: number
  batchResults?: {
    successful: any[]
    failed: any[]
  }
}

interface Props {
  payment: Payment
}

interface Emits {
  (e: 'close'): void
  (e: 'generate-receipt', paymentId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isBatchPayment = computed(() => {
  return !!props.payment.batchResults
})

const generateReceipt = () => {
  if (props.payment.id) {
    emit('generate-receipt', props.payment.id)
  }
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}
</script>