<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>
      
      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                Payment Details
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Transaction ID: {{ payment?.payment_id }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <div v-if="payment" class="space-y-6">
            <!-- Student Information -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Student Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                  <div class="text-sm text-gray-900">
                    {{ payment.name1 }} {{ payment.name2 }} {{ payment.name3 || '' }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Admission Number</label>
                  <div class="text-sm text-gray-900">{{ payment.adm }}</div>
                </div>
              </div>
            </div>

            <!-- Payment Information -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-3">Payment Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-blue-700 uppercase tracking-wide">Amount Paid</label>
                  <div class="text-lg font-bold text-blue-900">
                    KSh {{ payment.amount.toLocaleString() }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-blue-700 uppercase tracking-wide">Payment Date</label>
                  <div class="text-sm text-blue-900">
                    {{ formatDate(payment.dop) }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-blue-700 uppercase tracking-wide">Transaction Reference</label>
                  <div class="text-sm text-blue-900 font-mono">
                    {{ payment.ref }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-blue-700 uppercase tracking-wide">Bank/Method</label>
                  <div class="text-sm text-blue-900">
                    {{ payment.bank || 'Not specified' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Academic Information -->
            <div class="bg-green-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-green-900 mb-3">Academic Period</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-green-700 uppercase tracking-wide">Term</label>
                  <div class="text-sm text-green-900">{{ payment.term }}</div>
                </div>
                <div>
                  <label class="text-xs font-medium text-green-700 uppercase tracking-wide">Year</label>
                  <div class="text-sm text-green-900">{{ payment.year_paid }}</div>
                </div>
              </div>
            </div>

            <!-- Balance Information -->
            <div class="bg-orange-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-orange-900 mb-3">Balance Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-orange-700 uppercase tracking-wide">Balance After Payment</label>
                  <div class="text-lg font-bold text-orange-900">
                    KSh {{ (payment.balance || 0).toLocaleString() }}
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-orange-700 uppercase tracking-wide">Date Assigned</label>
                  <div class="text-sm text-orange-900">
                    {{ payment.date_ass ? formatDate(payment.date_ass) : 'N/A' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Details -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Additional Details</h4>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Payment Method:</span>
                  <span class="font-medium">{{ payment.bank || 'Bank Transfer' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Processing Date:</span>
                  <span class="font-medium">{{ formatDate(payment.dop) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Record Created:</span>
                  <span class="font-medium">{{ formatDate(payment.date_ass || payment.dop) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="printReceipt"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            <PrinterIcon class="h-4 w-4 mr-2" />
            Print Receipt
          </button>
          <button
            @click="$emit('close')"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification'
import { XMarkIcon, PrinterIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  payment: any
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  close: []
}>()

// State
const toast = useToast()

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const printReceipt = () => {
  // Generate and print receipt
  const receiptContent = generateReceiptHTML()
  const printWindow = window.open('', '_blank')
  
  if (printWindow) {
    printWindow.document.write(receiptContent)
    printWindow.document.close()
    printWindow.print()
    toast.success('Receipt sent to printer')
  } else {
    toast.error('Unable to open print window')
  }
}

const generateReceiptHTML = () => {
  const payment = props.payment
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .label { font-weight: bold; }
        .amount { font-size: 18px; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>SCHOOL FEE PAYMENT RECEIPT</h2>
        <p>Receipt No: ${payment.payment_id}</p>
      </div>
      
      <div class="section">
        <div><span class="label">Student Name:</span> ${payment.name1} ${payment.name2} ${payment.name3 || ''}</div>
        <div><span class="label">Admission Number:</span> ${payment.adm}</div>
      </div>
      
      <div class="section">
        <div><span class="label">Amount Paid:</span> <span class="amount">KSh ${payment.amount.toLocaleString()}</span></div>
        <div><span class="label">Payment Date:</span> ${formatDate(payment.dop)}</div>
        <div><span class="label">Reference:</span> ${payment.ref}</div>
        <div><span class="label">Method:</span> ${payment.bank || 'Bank Transfer'}</div>
      </div>
      
      <div class="section">
        <div><span class="label">Term:</span> ${payment.term}</div>
        <div><span class="label">Year:</span> ${payment.year_paid}</div>
        <div><span class="label">Balance After Payment:</span> KSh ${(payment.balance || 0).toLocaleString()}</div>
      </div>
      
      <div class="footer">
        <p>This is a computer-generated receipt.</p>
        <p>Printed on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `
}
</script>