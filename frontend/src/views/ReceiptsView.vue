<template>
  <div class="receipts-container">
    <div class="receipts-header">
      <h1>Receipts Management</h1>
      <p>Print and manage school fee receipts</p>
    </div>

    <div class="receipts-menu">
      <div class="menu-grid">
        <div class="menu-item" @click="selectOption(1)">
          <div class="menu-icon">👤</div>
          <h3>Print Individual Student Payment</h3>
          <p>Print payment receipt for a specific student</p>
        </div>

        <div class="menu-item" @click="selectOption(4)">
          <div class="menu-icon">📄</div>
          <h3>List Payments</h3>
          <p>Select and print payment receipts</p>
        </div>
      </div>
    </div>

    <!-- Receipt Selection Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ getModalTitle() }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Individual Student -->
          <div v-if="selectedOption === 1">
            <div class="form-group">
              <label for="studentSearch">Search Student (Name or Admission Number):</label>
              <input
                id="studentSearch"
                v-model="studentSearch"
                type="text"
                placeholder="Enter student name or admission number"
                class="form-input"
                @input="searchStudents"
              />
            </div>
            <div v-if="studentSearchResults.length > 0" class="search-results">
              <h4>Select Student:</h4>
              <div class="student-list">
                <div
                  v-for="student in studentSearchResults"
                  :key="student.adm"
                  class="student-item"
                  @click="selectStudent(student)"
                >
                  <div class="student-info">
                    <strong>{{ student.name1 }} {{ student.name2 }} {{ student.name3 }}</strong>
                    <br>
                    <small>ADM: {{ student.adm }} | Class: {{ student.class }}</small>
                  </div>
                  <div class="student-receipts">
                    {{ getStudentReceiptCount(student.adm) }} receipt(s) available
                  </div>
                </div>
              </div>
            </div>
            <div v-if="selectedStudent" class="selected-student">
              <h4>Selected Student:</h4>
              <div class="student-card">
                <div class="student-details">
                  <strong>{{ selectedStudent.name1 }} {{ selectedStudent.name2 }} {{ selectedStudent.name3 }}</strong>
                  <br>
                  <span>ADM: {{ selectedStudent.adm }} | Class: {{ selectedStudent.class }}</span>
                </div>
                <button class="btn btn-sm btn-outline" @click="clearSelectedStudent">
                  Change
                </button>
              </div>
            </div>
          </div>

          <!-- Term Receipts -->
          <div v-if="selectedOption === 2">
            <p>This option has been removed.</p>
          </div>

          <!-- Class Receipts -->
          <div v-if="selectedOption === 3">
            <p>This option has been removed.</p>
          </div>

          <!-- Previous Receipts -->
          <div v-if="selectedOption === 4">
            <div class="receipts-list">
              <div v-if="previousReceipts.length === 0" class="no-receipts">
                No payments found
              </div>
              <div v-else>
                <div class="list-header">
                  <h4>Payments ({{ previousReceipts.length }} total)</h4>
                  <div class="select-all">
                    <input
                      type="checkbox"
                      id="selectAllPrevious"
                      v-model="selectAllPrevious"
                      @change="toggleSelectAllPrevious"
                    />
                    <label for="selectAllPrevious">Select All</label>
                  </div>
                </div>
                <div class="receipt-item" v-for="receipt in previousReceipts" :key="receipt.payment_id">
                  <input
                    type="checkbox"
                    :id="'receipt-' + receipt.payment_id"
                    v-model="selectedReceipts"
                    :value="receipt.payment_id"
                  />
                  <label :for="'receipt-' + receipt.payment_id" class="receipt-label">
                    <div class="receipt-info">
                      <strong>Payment #{{ String(receipt.payment_id).padStart(4, '0') }}</strong>
                      <span class="student-name">{{ receipt.name }}</span>
                      <span class="adm-class">(ADM: {{ receipt.adm }} | Term: {{ receipt.term }} {{ receipt.year_paid }})</span>
                    </div>
                    <div class="receipt-details">
                      <span class="item">{{ receipt.bank }} {{ receipt.ref }}</span>
                      <span class="amount">KSh {{ formatAmount(receipt.amount) }}</span>
                      <span class="date">{{ formatDate(receipt.dop) }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn btn-primary"
            @click="printReceipts"
            :disabled="!canPrint"
          >
            Print Receipts
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt Preview Modal -->
    <ReceiptPreviewModal
      v-if="showPreview"
      :receipts="receiptsToPrint"
      :print-config="printConfig"
      @close="showPreview = false"
      @print="handlePrint"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal.vue'

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

interface TermOption {
  term: string
  year: number
}

const router = useRouter()

// State
const showModal = ref(false)
const showPreview = ref(false)
const selectedOption = ref<number | null>(null)
const studentSearch = ref('')
const selectedStudent = ref<any>(null)
const selectedTerm = ref<TermOption | null>(null)
const selectedClass = ref('')
const selectedReceipts = ref<number[]>([])
const selectAll = ref(false)
const selectAllPrevious = ref(false)

// Data
const unprintedReceipts = ref<Receipt[]>([])
const previousReceipts = ref<Receipt[]>([])
const studentSearchResults = ref<any[]>([])
const availableClasses = ref<string[]>([])
const availableTerms = ref<TermOption[]>([])
const printConfig = ref<any>(null)
const receiptsToPrint = ref<Receipt[]>([])

// Computed
const canPrint = computed(() => {
  switch (selectedOption.value) {
    case 1:
      return selectedStudent.value !== null
    case 4:
      return selectedReceipts.value.length > 0
    default:
      return false
  }
})

// Methods
const selectOption = (option: number) => {
  selectedOption.value = option
  selectedReceipts.value = []
  selectAll.value = false
  showModal.value = true

  // Load data based on option
  switch (option) {
    case 4:
      loadPreviousReceipts()
      break
  }
}

const closeModal = () => {
  showModal.value = false
  selectedOption.value = null
  studentSearch.value = ''
  selectedStudent.value = null
  selectedReceipts.value = []
  selectAll.value = false
  selectAllPrevious.value = false
  studentSearchResults.value = []
}

const getModalTitle = () => {
  switch (selectedOption.value) {
    case 1:
      return 'Print Individual Student Payment'
    case 4:
      return 'List Payments'
    default:
      return 'Print Payments'
  }
}

const loadUnprintedReceipts = async () => {
  try {
    const response = await api.get('/receipts/unprinted')
    unprintedReceipts.value = response.data?.data || []
  } catch (error) {
    console.error('Error loading unprinted receipts:', error)
    unprintedReceipts.value = []
  }
}

const loadPreviousReceipts = async () => {
  try {
    const response = await api.get('/receipts/previous?limit=50')
    previousReceipts.value = response.data?.data || []
  } catch (error) {
    console.error('Error loading previous receipts:', error)
    previousReceipts.value = []
  }
}

const loadFilterOptions = async () => {
  try {
    const response = await api.get('/receipts/filters')
    availableClasses.value = response.data.data.classes
    availableTerms.value = response.data.data.terms
  } catch (error) {
    console.error('Error loading filter options:', error)
  }
}

const loadPrintConfig = async () => {
  try {
    const response = await api.get('/receipts/config')
    printConfig.value = response.data.data
  } catch (error) {
    console.error('Error loading print config:', error)
  }
}

const toggleSelectAllPrevious = () => {
  if (selectAllPrevious.value) {
    selectedReceipts.value = previousReceipts.value.map(r => r.payment_id)
  } else {
    selectedReceipts.value = []
  }
}

const searchStudents = async () => {
  if (studentSearch.value.trim().length < 2) {
    studentSearchResults.value = []
    return
  }

  try {
    // Search students by name or ADM
    const response = await api.get('/students/search', {
      params: { q: studentSearch.value.trim() }
    })
    studentSearchResults.value = response.data.data || []
  } catch (error) {
    console.error('Error searching students:', error)
    studentSearchResults.value = []
  }
}

const selectStudent = (student: any) => {
  selectedStudent.value = student
  studentSearchResults.value = []
}

const clearSelectedStudent = () => {
  selectedStudent.value = null
  studentSearch.value = ''
}

const getStudentReceiptCount = (adm: number): number => {
  // This could be optimized by caching or making a separate API call
  // For now, we'll return a placeholder
  return 0 // TODO: Implement actual count
}

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-GB')
  } catch {
    return dateString
  }
}

const printReceipts = async () => {
  try {
    let receipts: Receipt[] = []

    switch (selectedOption.value) {
      case 1:
        // Get individual student receipts
        if (selectedStudent.value) {
          const studentResponse = await api.get(`/receipts/student/${selectedStudent.value.adm}`)
          receipts = studentResponse.data?.data || []
        }
        break
      case 4:
        // Filter selected receipts
        if (Array.isArray(previousReceipts.value)) {
          receipts = previousReceipts.value.filter(r => selectedReceipts.value.includes(r.payment_id))
        }
        break
    }

    if (!Array.isArray(receipts) || receipts.length === 0) {
      alert('No payments found to print')
      return
    }

    receiptsToPrint.value = receipts
    showModal.value = false
    showPreview.value = true
  } catch (error) {
    console.error('Error preparing payments for printing:', error)
    alert('Error preparing payments for printing')
  }
}

const handlePrint = async (receiptNumbers: number[]) => {
  try {
    // Mark receipts as printed
    if (receiptNumbers.length > 0) {
      await api.post('/receipts/mark-printed', { receiptNumbers })
    }

    showPreview.value = false
    alert('Payments printed successfully!')
  } catch (error) {
    console.error('Error marking receipts as printed:', error)
    alert('Error updating receipt status')
  }
}

// Watchers
// Removed watcher for selectAll since option 5 was removed

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadFilterOptions(),
    loadPrintConfig()
  ])
})
</script>

<style scoped>
.receipts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.receipts-header {
  text-align: center;
  margin-bottom: 40px;
}

.receipts-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.receipts-header p {
  color: #7f8c8d;
  font-size: 1.1em;
}

.receipts-menu {
  margin-top: 30px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.menu-item {
  background: white;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.menu-item:hover {
  border-color: #3498db;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.menu-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.menu-item h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.2em;
}

.menu-item p {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

/* Receipts List */
.receipts-list {
  max-height: 300px;
  overflow-y: auto;
}

.receipt-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #f8f9fa;
}

.receipt-item input[type="checkbox"] {
  margin-right: 10px;
}

.receipt-item label {
  flex: 1;
  cursor: pointer;
  font-size: 14px;
}

.select-all {
  margin-bottom: 15px;
  padding: 10px;
  background: #e8f4fd;
  border-radius: 4px;
}

.no-receipts {
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
  font-style: italic;
}

/* Search Results */
.search-results {
  margin-top: 15px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
}

.search-results h4 {
  margin: 0;
  padding: 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  font-size: 14px;
}

.student-list {
  max-height: 180px;
  overflow-y: auto;
}

.student-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.student-item:hover {
  background: #f8f9fa;
}

.student-item:last-child {
  border-bottom: none;
}

.student-info {
  font-size: 14px;
}

.student-receipts {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

/* Selected Student */
.selected-student {
  margin-top: 15px;
  padding: 15px;
  background: #e8f4fd;
  border-radius: 4px;
  border: 1px solid #3498db;
}

.selected-student h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #2c3e50;
}

.student-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-details {
  font-size: 14px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #3498db;
  color: #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

/* List Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e1e8ed;
}

.list-header h4 {
  margin: 0;
  color: #2c3e50;
}

/* Enhanced Receipt Items */
.receipt-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.receipt-info {
  flex: 1;
}

.receipt-info .student-name {
  display: block;
  color: #2c3e50;
  margin: 2px 0;
}

.receipt-info .adm-class {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
}

.receipt-details {
  text-align: right;
  font-size: 12px;
}

.receipt-details .item {
  display: block;
  color: #34495e;
  margin-bottom: 2px;
}

.receipt-details .amount {
  display: block;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 2px;
}

.receipt-details .date {
  display: block;
  color: #7f8c8d;
}
</style>