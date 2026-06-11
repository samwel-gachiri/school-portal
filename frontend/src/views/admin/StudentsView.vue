<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between mb-6">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Student Management
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          Manage students, view balances, and add new admissions.
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <button
          @click="openAddModal"
          class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Student
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
      <div class="flex space-x-4 mb-4">
        <div class="flex-1">
          <label for="search" class="sr-only">Search</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="searchStudents"
              class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search by name, admission number, or class..."
            />
          </div>
        </div>
        <button
          @click="searchStudents"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
        >
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <!-- Results Table -->
      <div class="mt-4 flex flex-col">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="loading">
                    <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Loading...</td>
                  </tr>
                  <tr v-else-if="students.length === 0">
                    <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {{ hasSearched ? 'No students found.' : 'Search to view students.' }}
                    </td>
                  </tr>
                  <tr v-for="student in students" :key="student.adm" class="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out" @click="openStudentDetails(student)">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{{ student.adm }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ student.name1 }} {{ student.name2 }} {{ student.name3 || '' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ student.className || student.class }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span :class="student.currentBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'">
                        {{ formatCurrency(student.currentBalance) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Student Modal -->
    <div v-if="showAddModal" class="fixed inset-0 overflow-y-auto z-50">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="showAddModal = false">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <svg class="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Add New Student</h3>
            </div>
            
            <form @submit.prevent="submitStudent" class="mt-5 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">First Name *</label>
                  <input type="text" v-model="studentForm.name1" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Middle Name *</label>
                  <input type="text" v-model="studentForm.name2" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" v-model="studentForm.name3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Class *</label>
                  <select v-model="studentForm.classId" required class="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="" disabled>Select Class</option>
                    <option v-for="c in classes" :key="c.class_id" :value="c.class_id">{{ c.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" v-model="studentForm.dob" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Parent Phone</label>
                <input type="text" v-model="studentForm.fphone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>

              <div class="border-t border-gray-200 pt-4 mt-4">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input id="applyCharge" type="checkbox" v-model="studentForm.applyAdmissionCharge" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="applyCharge" class="font-medium text-gray-700">Apply Admission Charge</label>
                    <p class="text-gray-500">Automatically add an admission fee for this new student.</p>
                  </div>
                </div>

                <div v-if="studentForm.applyAdmissionCharge" class="mt-3 ml-7">
                  <label class="block text-sm font-medium text-gray-700">Admission Fee Amount</label>
                  <div class="mt-1 relative rounded-md shadow-sm w-1/2">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 sm:text-sm">KSh</span>
                    </div>
                    <input type="number" v-model="studentForm.admissionChargeAmount" required min="0" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md py-2 border">
                  </div>
                </div>
              </div>

              <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense pt-2">
                <button type="submit" :disabled="submitting" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400">
                  {{ submitting ? 'Saving...' : 'Add Student' }}
                </button>
                <button type="button" @click="showAddModal = false" :disabled="submitting" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Details Drawer -->
    <div v-if="showDetailsDrawer" class="fixed inset-0 overflow-hidden z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-gray-500 opacity-75 transition-opacity" @click="showDetailsDrawer = false"></div>
        <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div class="w-screen max-w-md transform transition-all shadow-2xl">
            <div class="h-full flex flex-col bg-white overflow-y-scroll">
              <div class="px-4 py-6 bg-indigo-700 sm:px-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-medium text-white" id="slide-over-title">Student Details</h2>
                  <div class="ml-3 h-7 flex items-center">
                    <button type="button" @click="showDetailsDrawer = false" class="bg-indigo-700 rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                      <span class="sr-only">Close panel</span>
                      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mt-1">
                  <p class="text-sm text-indigo-300">Detailed financial flow and timeline.</p>
                </div>
              </div>
              
              <div v-if="loadingDetails" class="p-6 text-center text-gray-500">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading details...
              </div>
              <div v-else-if="selectedStudent" class="relative flex-1">
                <!-- Header Info -->
                <div class="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 class="text-xl leading-6 font-bold text-gray-900">{{ selectedStudent.student.name1 }} {{ selectedStudent.student.name2 }} {{ selectedStudent.student.name3 || '' }}</h3>
                  <div class="mt-2 max-w-2xl text-sm text-gray-500 flex justify-between">
                    <span><strong class="text-gray-700">Adm:</strong> {{ selectedStudent.student.adm }}</span>
                    <span><strong class="text-gray-700">Class:</strong> {{ selectedStudent.student.class }}</span>
                  </div>
                  <div class="mt-3 bg-white p-3 rounded-md shadow-sm border border-gray-100 flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500">Current Balance</span>
                    <span :class="['text-lg font-bold', selectedStudent.student.currentBalance > 0 ? 'text-red-600' : 'text-green-600']">
                      {{ formatCurrency(selectedStudent.student.currentBalance) }}
                    </span>
                  </div>
                </div>

                <!-- Timeline -->
                <div class="px-4 py-5 sm:p-6">
                  <h4 class="text-md font-semibold text-gray-900 mb-6 uppercase tracking-wider">Financial Timeline</h4>
                  <div class="flow-root">
                    <ul role="list" class="-mb-8">
                      <li v-if="!selectedStudent.transactions || selectedStudent.transactions.length === 0">
                        <p class="text-sm text-gray-500 italic text-center py-4">No transactions recorded.</p>
                      </li>
                      <li v-for="(transaction, transactionIdx) in selectedStudent.transactions" :key="transaction.id + transaction.type">
                        <div class="relative pb-8">
                          <span v-if="transactionIdx !== selectedStudent.transactions.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          <div class="relative flex space-x-3">
                            <div>
                              <span :class="[transaction.type === 'PAYMENT' ? 'bg-green-500' : 'bg-red-500', 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white shadow-sm']">
                                <svg v-if="transaction.type === 'PAYMENT'" class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <svg v-else class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" clip-rule="evenodd" />
                                </svg>
                              </span>
                            </div>
                            <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p class="text-sm text-gray-500">
                                  <span v-if="transaction.type === 'PAYMENT'" class="font-bold text-green-700">Paid {{ formatCurrency(transaction.amount) }}</span>
                                  <span v-else class="font-bold text-red-700">Charged {{ formatCurrency(transaction.amount) }}</span>
                                  <br>
                                  <span class="text-gray-800">{{ transaction.name }}</span>
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  Term {{ transaction.term }} {{ transaction.year }}
                                  <span v-if="transaction.bank" class="block text-gray-500 font-medium mt-0.5">{{ transaction.bank }} ({{ transaction.ref }})</span>
                                </p>
                              </div>
                              <div class="text-right text-sm whitespace-nowrap text-gray-500 flex flex-col items-end">
                                <time :datetime="transaction.date" class="font-medium text-gray-600">{{ formatDate(transaction.date) }}</time>
                                <span class="text-xs mt-2 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">Bal: <span class="font-mono text-gray-700">{{ formatCurrency(transaction.balance) }}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()

const students = ref<any[]>([])
const classes = ref<any[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const searchQuery = ref('')

const showAddModal = ref(false)
const submitting = ref(false)

// Drawer refs
const showDetailsDrawer = ref(false)
const loadingDetails = ref(false)
const selectedStudent = ref<any>(null)

const defaultForm = {
  name1: '',
  name2: '',
  name3: '',
  fphone: '',
  dob: '',
  classId: '',
  applyAdmissionCharge: true,
  admissionChargeAmount: 500
}

const studentForm = ref({ ...defaultForm })

onMounted(async () => {
  // Fetch classes for the dropdown. 
  // The /charges/defaults endpoint already returns the list of classes, so we can reuse it.
  try {
    const res = await api.get<any>('/charges/defaults')
    if (res.success && res.data && res.data.classes) {
      classes.value = res.data.classes
    }
  } catch (e) {
    console.error('Failed to load classes', e)
  }
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

const openStudentDetails = async (student: any) => {
  showDetailsDrawer.value = true
  loadingDetails.value = true
  selectedStudent.value = null

  try {
    const res = await api.get<any>(`/students/${student.adm}`)
    if (res.success && res.data) {
      selectedStudent.value = res.data
    }
  } catch (error: any) {
    toast.error('Failed to load student details')
    showDetailsDrawer.value = false
  } finally {
    loadingDetails.value = false
  }
}

const searchStudents = async () => {
  if (!searchQuery.value.trim()) {
    toast.warning('Please enter a search term')
    return
  }

  loading.value = true
  hasSearched.value = true
  
  try {
    const res = await api.get<any>('/students/search', { query: searchQuery.value, searchType: 'all', limit: 100 })
    if (res.success && res.data) {
      students.value = res.data.students || []
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Failed to search students')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  studentForm.value = { ...defaultForm }
  showAddModal.value = true
}

const submitStudent = async () => {
  submitting.value = true
  try {
    const payload = {
      ...studentForm.value,
      // Ensure empty strings for optional fields are treated properly
      name3: studentForm.value.name3 || '',
      fphone: studentForm.value.fphone || '',
      dob: studentForm.value.dob || ''
    }
    
    const res = await api.post<any>('/students', payload)
    
    if (res.success) {
      toast.success('Student added successfully!')
      showAddModal.value = false
      
      // Automatically search for the newly added student to show them in the list
      if (res.data && res.data.adm) {
        searchQuery.value = res.data.adm.toString()
        await searchStudents()
      }
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || error.message || 'Failed to add student')
  } finally {
    submitting.value = false
  }
}
</script>
