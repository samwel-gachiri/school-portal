<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content receipt-preview-modal" @click.stop>
      <div class="modal-header">
        <h2>Receipt Preview - {{ currentReceiptIndex + 1 }} of {{ Array.isArray(receipts) ? receipts.length : 0 }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="preview-controls">
          <button
            class="nav-btn"
            @click="previousReceipt"
            :disabled="currentReceiptIndex === 0"
          >
            ← Previous
          </button>

          <span class="receipt-counter">
            {{ currentReceiptIndex + 1 }} / {{ Array.isArray(receipts) ? receipts.length : 0 }}
          </span>

          <button
            class="nav-btn"
            @click="nextReceipt"
            :disabled="currentReceiptIndex === (Array.isArray(receipts) ? receipts.length - 1 : 0)"
          >
            Next →
          </button>
        </div>

        <div class="receipt-preview" id="receipt-preview">
          <div v-if="visibleReceipts.length === 0" class="no-receipts">
            No receipts to preview
          </div>
          <div class="receipt-container" v-for="(receipt, index) in visibleReceipts" :key="receipt?.payment_id || index">
            <!-- School Header -->
            <div class="receipt-header">
              <div class="school-logo">
                <img v-if="schoolLogo" :src="schoolLogo" alt="School Logo" />
                <div v-else class="logo-placeholder">LOGO</div>
              </div>
              <div class="school-info">
                <h1 class="school-name">{{ getSchoolName() }}</h1>
                <h2 class="school-motto">{{ getSchoolMotto() }}</h2>
                <p class="school-address">{{ getSchoolAddress() }}</p>
                <p class="school-contact">
                  littleangelsacademy@gmail.com<br>
                  Telephone no: +2547-2098-5433
                </p>
                <h3 class="receipt-title">PAYMENT RECEIPT</h3>
              </div>
            </div>

            <!-- Receipt Details -->
            <div class="receipt-details">
              <div class="student-info">
                <p><strong>Name:</strong> {{ receipt?.name || '' }}</p>
                <p><strong>Adm no:</strong> {{ receipt?.adm || '' }}</p>
                <p><strong>DOP:</strong> {{ formatDate(receipt?.dop) }}</p>
                <p><strong>Term:</strong> {{ receipt?.term || '' }}</p>
                <p><strong>Year:</strong> {{ receipt?.year_paid || '' }}</p>
              </div>

              <div class="receipt-number">
                <p><strong>PAYMENT ID: {{ String(receipt?.payment_id || 0).padStart(4, '0') }}</strong></p>
              </div>
            </div>

            <!-- Receipt Table -->
            <div class="receipt-table">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Payment via: {{ receipt?.bank || '' }} {{ receipt?.ref || '' }}</td>
                    <td>KSh {{ formatAmount(receipt?.amount || 0) }}</td>
                  </tr>
                  <tr class="balance-row">
                    <td>{{ (receipt?.balance || 0) < 0 ? 'Overpay' : 'Balance' }}</td>
                    <td>KSh {{ formatAmount(Math.abs(receipt?.balance || 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div class="receipt-footer">
              <p><strong>Served By: SECRETARY</strong></p>
              <div class="signature-line">
                _______________________________
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="printReceipts">
          Print All ({{ Array.isArray(receipts) ? receipts.length : 0 }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { receiptsApi } from '@/services/api'

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
  class?: string
  stream?: string
}

interface PrintConfig {
  config: Record<string, any>
  vars: Record<string, string>
  school: any
}

interface Props {
  receipts: Receipt[]
  printConfig: PrintConfig | null
}

interface Emits {
  (e: 'close'): void
  (e: 'print', receiptNumbers: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentReceiptIndex = ref(0)
const schoolLogo = ref<string | null>(null)

// Computed
const visibleReceipts = computed(() => {
  if (!Array.isArray(props.receipts) || props.receipts.length === 0) {
    return []
  }
  // For preview, show current receipt and next one (for double-sided printing)
  const current = props.receipts[currentReceiptIndex.value]
  const next = props.receipts[currentReceiptIndex.value + 1]
  return next ? [current, next] : [current]
})

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-GB')
  } catch {
    return dateString
  }
}

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getSchoolName = (): string => {
  if (props.printConfig?.school?.name) {
    const section = Array.isArray(props.receipts) && props.receipts.length > 0 ? props.receipts[0]?.section : ''
    return `${props.printConfig.school.name} ${section || ''}`
  }
  const section = Array.isArray(props.receipts) && props.receipts.length > 0 ? props.receipts[0]?.section : ''
  return `LITTLE ANGELS ACADEMY ${section || ''}`
}

const getSchoolMotto = (): string => {
  return props.printConfig?.school?.motto || 'QUALITY EDUCATION SERVICE AND DISCIPLINE'
}

const getSchoolAddress = (): string => {
  return props.printConfig?.school?.address || '7093-THIKA'
}

const previousReceipt = () => {
  if (currentReceiptIndex.value > 0) {
    currentReceiptIndex.value--
  }
}

const nextReceipt = () => {
  if (Array.isArray(props.receipts) && currentReceiptIndex.value < props.receipts.length - 1) {
    currentReceiptIndex.value++
  }
}

const generateReceiptHtml = (): string => {
  if (!Array.isArray(props.receipts) || props.receipts.length === 0) {
    return '<p>No receipts to print</p>'
  }

  const logoHtml = schoolLogo.value 
    ? `<img src="${schoolLogo.value}" alt="School Logo" style="width: 80px; height: 80px;" />`
    : '<div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; font-weight: bold; color: #7f8c8d;">LOGO</div>'

  return props.receipts.map(receipt => `
    <div class="receipt-container">
      <!-- School Header -->
      <div class="receipt-header">
        <div class="school-logo">
          ${logoHtml}
        </div>
        <div class="school-info">
          <h1 class="school-name">${getSchoolName()}</h1>
          <h2 class="school-motto">${getSchoolMotto()}</h2>
          <p class="school-address">${getSchoolAddress()}</p>
          <p class="school-contact">
            littleangelsacademy@gmail.com<br>
            Telephone no: +2547-2098-5433
          </p>
          <h3 class="receipt-title">PAYMENT RECEIPT</h3>
        </div>
      </div>

      <!-- Receipt Details -->
      <div class="receipt-details">
        <div class="student-info">
          <p><strong>Name:</strong> ${receipt?.name || ''}</p>
          <p><strong>Adm no:</strong> ${receipt?.adm || ''}</p>
          <p><strong>DOP:</strong> ${formatDate(receipt?.dop)}</p>
          <p><strong>Term:</strong> ${receipt?.term || ''}</p>
          <p><strong>Year:</strong> ${receipt?.year_paid || ''}</p>
        </div>

        <div class="receipt-number">
          <p><strong>PAYMENT ID: ${String(receipt?.payment_id || 0).padStart(4, '0')}</strong></p>
        </div>
      </div>

      <!-- Receipt Table -->
      <div class="receipt-table">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Payment via: ${receipt?.bank || ''} ${receipt?.ref || ''}</td>
              <td>KSh ${formatAmount(receipt?.amount || 0)}</td>
            </tr>
            <tr class="balance-row">
              <td>${(receipt?.balance || 0) < 0 ? 'Overpay' : 'Balance'}</td>
              <td>KSh ${formatAmount(Math.abs(receipt?.balance || 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="receipt-footer">
        <p><strong>Served By: SECRETARY</strong></p>
        <div class="signature-line">
          _______________________________
        </div>
      </div>
    </div>
  `).join('')
}

const printReceipts = () => {
  // Create a print-specific document
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Print failed: Please allow popups for this site and try again.')
    return
  }

  // Get the receipt HTML
  const receiptHtml = generateReceiptHtml()

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipts</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
        }
        
        .receipt-container {
          page-break-after: always;
          margin-bottom: 20px;
        }
        
        .receipt-header {
          display: flex;
          margin-bottom: 20px;
        }
        
        .school-logo {
          width: 80px;
          height: 80px;
          margin-right: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ddd;
        }
        
        .logo-placeholder {
          font-weight: bold;
          color: #7f8c8d;
        }
        
        .school-info {
          flex: 1;
          text-align: center;
        }
        
        .school-name {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 5px 0;
          text-decoration: underline;
        }
        
        .school-motto {
          font-size: 14px;
          margin: 0 0 5px 0;
        }
        
        .school-address {
          margin: 5px 0;
        }
        
        .school-contact {
          margin: 5px 0;
          font-size: 11px;
        }
        
        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
          text-decoration: underline;
        }
        
        .receipt-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #000;
        }
        
        .student-info {
          flex: 1;
        }
        
        .student-info p {
          margin: 2px 0;
        }
        
        .receipt-number {
          text-align: right;
        }
        
        .receipt-number p {
          margin: 0;
          font-weight: bold;
        }
        
        .receipt-table {
          margin: 20px 0;
        }
        
        .receipt-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .receipt-table th,
        .receipt-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        .receipt-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .balance-row {
          border-top: 2px solid #000;
        }
        
        .receipt-footer {
          margin-top: 30px;
          text-align: center;
        }
        
        .signature-line {
          margin-top: 10px;
          border-bottom: 1px solid #000;
          width: 200px;
          margin-left: auto;
          margin-right: auto;
        }
        
        @media print {
          .receipt-container {
            page-break-after: always;
            margin-bottom: 0;
          }
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
    </body>
    </html>
  `)

  printWindow.document.close()
  
  // Wait a bit for the content to load, then print
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
      
      // Close the window after printing (with a delay to allow print dialog)
      setTimeout(() => {
        printWindow.close()
        
        // After printing, mark receipts as printed
        if (Array.isArray(props.receipts)) {
          const paymentIds = props.receipts.map(r => r.payment_id)
          emit('print', paymentIds)
        } else {
          emit('print', [])
        }
      }, 1000)
    } catch (error) {
      console.error('Print error:', error)
      printWindow.close()
      alert('Print failed. Please try again.')
    }
  }, 500)
}

// Load school logo
const loadSchoolLogo = async () => {
  try {
    // Fetch logo from API using the API service
    const blob = await receiptsApi.getLogo()
    
    if (blob.size === 0) {
      schoolLogo.value = null
      return
    }
    
    const dataUrl = await blobToDataUrl(blob)
    
    // Test if the data URL is valid by creating an image
    const testImg = new Image()
    testImg.onload = () => {
      schoolLogo.value = dataUrl
    }
    testImg.onerror = () => {
      schoolLogo.value = null
    }
    testImg.src = dataUrl
    
  } catch (error) {
    schoolLogo.value = null
  }
}// Helper function to convert blob to data URL
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

onMounted(() => {
  loadSchoolLogo()
})
</script>

<style scoped>
/* Modal Base Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
}

.receipt-preview-modal .modal-content {
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.nav-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.nav-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.receipt-counter {
  font-weight: bold;
  color: #2c3e50;
}

.receipt-preview {
  border: 1px solid #ddd;
  padding: 20px;
  background: white;
  max-height: 500px;
  overflow-y: auto;
}

/* Receipt Styles */
.receipt-container {
  page-break-after: always;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.receipt-header {
  display: flex;
  margin-bottom: 20px;
}

.school-logo {
  width: 80px;
  height: 80px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
}

.logo-placeholder {
  font-weight: bold;
  color: #7f8c8d;
}

.school-info {
  flex: 1;
  text-align: center;
}

.school-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 5px 0;
  text-decoration: underline;
}

.school-motto {
  font-size: 14px;
  margin: 0 0 5px 0;
}

.school-address {
  margin: 5px 0;
}

.school-contact {
  margin: 5px 0;
  font-size: 11px;
}

.receipt-title {
  font-size: 14px;
  font-weight: bold;
  margin: 10px 0;
  text-decoration: underline;
}

.receipt-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #000;
}

.student-info {
  flex: 1;
}

.student-info p {
  margin: 2px 0;
}

.receipt-number {
  text-align: right;
}

.receipt-number p {
  margin: 0;
  font-weight: bold;
}

.receipt-table {
  margin: 20px 0;
}

.receipt-table table {
  width: 100%;
  border-collapse: collapse;
}

.receipt-table th,
.receipt-table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
}

.receipt-table th {
  background: #f0f0f0;
  font-weight: bold;
}

.balance-row {
  border-top: 2px solid #000;
}

.receipt-footer {
  margin-top: 30px;
  text-align: center;
}

.signature-line {
  margin-top: 10px;
  border-bottom: 1px solid #000;
  width: 200px;
  margin-left: auto;
  margin-right: auto;
}

/* Print Styles */
@media print {
  /* Hide everything except the modal */
  body * {
    visibility: hidden;
  }
  
  /* Show only the modal content */
  .modal-overlay,
  .modal-overlay * {
    visibility: visible;
  }
  
  /* Hide modal chrome */
  .modal-overlay {
    position: static;
    background: none;
    display: block;
    width: auto;
    height: auto;
  }
  
  .modal-content {
    box-shadow: none;
    border: none;
    width: auto;
    max-width: none;
    max-height: none;
  }
  
  .modal-header,
  .modal-footer,
  .preview-controls {
    display: none !important;
  }

  .receipt-preview {
    border: none;
    padding: 0;
    max-height: none;
    overflow: visible;
  }

  .receipt-container {
    page-break-after: always;
    margin-bottom: 0;
  }
}
</style>