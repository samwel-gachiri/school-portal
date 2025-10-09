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
                    <td>{{ (receipt?.balance || 0) > 0 ? 'Balance' : 'Overpay' }}</td>
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

const printReceipts = () => {
  // Use browser print API
  window.print()

  // After printing, mark receipts as printed
  if (Array.isArray(props.receipts)) {
    const paymentIds = props.receipts.map(r => r.payment_id)
    emit('print', paymentIds)
  } else {
    emit('print', [])
  }
}

// Load school logo
const loadSchoolLogo = async () => {
  try {
    // Try to load logo from API
    // For now, we'll use a placeholder
    schoolLogo.value = null
  } catch (error) {
    console.error('Error loading school logo:', error)
  }
}

onMounted(() => {
  loadSchoolLogo()
})
</script>

<style scoped>
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
  .modal-overlay,
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