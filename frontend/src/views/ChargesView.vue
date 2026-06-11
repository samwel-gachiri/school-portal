<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col items-start gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Student Charges</h1>
        </div>
        <button
          @click="showClassChargeModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Add Charges to Students in a Class
        </button>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <!-- Student Search Section -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Student Search</h2>
          <div class="relative">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
              Search by Admission Number or Name
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="Enter admission number or student name..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @input="handleSearch"
              @focus="showDropdown = true"
              @blur="hideDropdown"
            />
            
            <!-- Search Results Dropdown -->
            <div 
              v-if="showDropdown && searchResults.length > 0" 
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-300 overflow-auto focus:outline-none"
            >
              <div
                v-for="student in searchResults"
                :key="student.adm"
                @mousedown="selectStudent(student)"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span class="text-xs font-medium text-gray-600">
                      {{ student.name1?.charAt(0) }}{{ student.name2?.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">
                      {{ student.name1 }} {{ student.name2 }} {{ student.name3 || '' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ADM: {{ student.adm }} • {{ student.class_name || 'N/A' }} • Balance: KSh {{ formatAmount(student.balance) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Details Display -->
        <div v-if="selectedStudent" class="mb-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 class="text-lg font-semibold text-blue-900 mb-3">Student Details</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-blue-700 font-medium">Admission No:</span>
              <div class="text-blue-900">{{ selectedStudent.adm }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Name:</span>
              <div class="text-blue-900">{{ selectedStudent.name1 }} {{ selectedStudent.name2 }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Class:</span>
              <div class="text-blue-900">{{ selectedStudent.class_name || 'N/A' }}</div>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Outstanding Balance:</span>
              <div class="text-blue-900 font-semibold" :class="selectedStudent.balance > 0 ? 'text-red-600' : 'text-green-600'">
                KSh {{ formatAmount(selectedStudent.balance) }}
              </div>
            </div>
          </div>

          <!-- Charges History -->
          <div v-if="chargeHistory.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Recent Charges</h4>
            <div class="max-h-32 overflow-y-auto">
              <table class="min-w-full text-xs text-left">
                <thead class="bg-blue-100">
                  <tr>
                    <th class="px-2 py-1">Date</th>
                    <th class="px-2 py-1">Charge Name</th>
                    <th class="px-2 py-1">Term/Year</th>
                    <th class="px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="charge in chargeHistory" :key="charge.chargeId" class="border-b border-blue-100">
                    <td class="px-2 py-1">{{ formatDate(charge.dateAss) }}</td>
                    <td class="px-2 py-1">{{ charge.name }}</td>
                    <td class="px-2 py-1">{{ charge.term }} {{ charge.yearAss }}</td>
                    <td class="px-2 py-1 text-right">{{ formatAmount(charge.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add Charge Form -->
        <div v-if="selectedStudent">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Add Charge</h2>
          <form @submit.prevent="submitStudentCharge" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Charge Name *</label>
                <input v-model="chargeForm.name" type="text" required placeholder="e.g. SCHOOL_FEES" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Amount (KSh) *</label>
                <input v-model="chargeForm.amount" type="number" step="0.01" min="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                <select v-model="chargeForm.term" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="ONE">ONE</option>
                  <option value="TWO">TWO</option>
                  <option value="THREE">THREE</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <input v-model="chargeForm.yearAss" type="number" required class="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input v-model="chargeForm.dateAss" type="date" required class="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            
            <div class="flex space-x-3 mt-4">
              <button type="submit" :disabled="submitting" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                {{ submitting ? 'Adding...' : 'Apply Charge' }}
              </button>
            </div>
          </form>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
        </div>
      </div>
    </div>

    <!-- Class Charge Modal -->
    <div v-if="showClassChargeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div class="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Apply Class Charge</h3>
        <form @submit.prevent="submitClassCharge" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
            <select v-model="classChargeForm.classId" required class="w-full px-3 py-2 border rounded-md">
              <option value="">Select a class...</option>
              <option v-for="c in classes" :key="c.class_id" :value="c.class_id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Charge Name *</label>
            <input v-model="classChargeForm.name" type="text" required placeholder="e.g. TOUR_FEE" class="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KSh) *</label>
            <input v-model="classChargeForm.amount" type="number" step="0.01" min="0.01" required class="w-full px-3 py-2 border rounded-md" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <select v-model="classChargeForm.term" required class="w-full px-3 py-2 border rounded-md">
                <option value="ONE">ONE</option>
                <option value="TWO">TWO</option>
                <option value="THREE">THREE</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input v-model="classChargeForm.yearAss" type="number" required class="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input v-model="classChargeForm.dateAss" type="date" required class="w-full px-3 py-2 border rounded-md" />
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button type="button" @click="showClassChargeModal = false" class="flex-1 px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" :disabled="submitting" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md">
              {{ submitting ? 'Processing (may take a minute)...' : 'Apply to Class' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const showDropdown = ref(false)
const selectedStudent = ref<any>(null)
const chargeHistory = ref<any[]>([])
const classes = ref<any[]>([])

const showClassChargeModal = ref(false)
const submitting = ref(false)

const chargeForm = ref({
  name: '',
  amount: '',
  term: 'ONE',
  yearAss: new Date().getFullYear(),
  dateAss: new Date().toISOString().split('T')[0]
})

const classChargeForm = ref({
  classId: '',
  name: '',
  amount: '',
  term: 'ONE',
  yearAss: new Date().getFullYear(),
  dateAss: new Date().toISOString().split('T')[0]
})

let searchTimeout: any = null

onMounted(async () => {
  try {
    const res = await api.get<any>('/charges/defaults')
    if (res.success && res.data) {
      chargeForm.value.term = res.data.term || 'ONE'
      chargeForm.value.yearAss = res.data.year || new Date().getFullYear()
      classChargeForm.value.term = res.data.term || 'ONE'
      classChargeForm.value.yearAss = res.data.year || new Date().getFullYear()
      classes.value = res.data.classes || []
    }
  } catch (error) {
    console.error("Failed to load defaults", error)
  }
})

const handleSearch = () => {
  if (selectedStudent.value) selectedStudent.value = null
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = []
      showDropdown.value = false
      return
    }
    
    try {
      const res = await api.get<any[]>('/charges/students/search?query=' + encodeURIComponent(searchQuery.value.trim()))
      if (res.success && res.data) {
        searchResults.value = res.data
        showDropdown.value = true
      }
    } catch (error) {
      searchResults.value = []
    }
  }, 300)
}

const hideDropdown = () => setTimeout(() => showDropdown.value = false, 150)

const selectStudent = async (student: any) => {
  showDropdown.value = false
  selectedStudent.value = student
  searchQuery.value = `${student.adm} - ${student.name1} ${student.name2}`

  // Fetch charge history
  try {
    const res = await api.get<any[]>(`/charges/students/${student.adm}`)
    if (res.success && res.data) {
      chargeHistory.value = res.data
    }
  } catch (error) {
    console.error("Failed to load charge history", error)
  }
}

const submitStudentCharge = async () => {
  submitting.value = true
  try {
    const payload = {
      ...chargeForm.value,
      adm: selectedStudent.value.adm,
      name: chargeForm.value.name.replace(/\s+/g, '_').toUpperCase()
    }
    const res = await api.post<any>('/charges/student', payload)
    if (res.success) {
      toast.success('Charge applied successfully!')
      chargeForm.value.name = ''
      chargeForm.value.amount = ''
      // Refresh student details
      selectedStudent.value.balance = res.data.newBalance
      chargeHistory.value.unshift(res.data)
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to apply charge')
  } finally {
    submitting.value = false
  }
}

const submitClassCharge = async () => {
  submitting.value = true
  try {
    const payload = {
      ...classChargeForm.value,
      name: classChargeForm.value.name.replace(/\s+/g, '_').toUpperCase()
    }
    // Applying to an entire class involves many queries, so we extend the timeout to 2 minutes
    const res = await api.post<any>('/charges/class', payload, { timeout: 120000 })
    if (res.success) {
      toast.success(res.message || 'Class charge applied successfully!')
      showClassChargeModal.value = false
      classChargeForm.value.name = ''
      classChargeForm.value.amount = ''
      classChargeForm.value.classId = ''
      // Refresh student details if the currently selected student is in this class
      if (selectedStudent.value && selectedStudent.value.class_id == classChargeForm.value.classId) {
        selectedStudent.value.balance += parseFloat(classChargeForm.value.amount)
        chargeHistory.value = [] // clear history, requiring re-fetch
      }
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to apply class charge')
  } finally {
    submitting.value = false
  }
}

const formatAmount = (amt: number) => {
  return new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2 }).format(Math.abs(amt))
}
const formatDate = (dStr: string) => {
  if (!dStr) return '-'
  return new Date(dStr).toLocaleDateString('en-KE')
}
</script>
