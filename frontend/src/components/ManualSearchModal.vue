<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>
      
      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                Manual Student Search
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Search for the correct student for this payment
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <!-- Payment Info -->
          <div v-if="payment" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Payment Details</h4>
            <div class="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div><strong>Amount:</strong> KSh {{ payment.amount.toLocaleString() }}</div>
              <div><strong>Reference:</strong> {{ payment.transactionRef }}</div>
              <div><strong>Student Name:</strong> {{ payment.studentName }}</div>
              <div><strong>Class:</strong> {{ payment.className }}</div>
            </div>
          </div>
          
          <!-- Search Interface -->
          <div class="space-y-4">
            <div class="flex space-x-4">
              <div class="flex-1">
                <label for="searchQuery" class="block text-sm font-medium text-gray-700 mb-1">
                  Search Students
                </label>
                <input
                  id="searchQuery"
                  v-model="searchQuery"
                  type="text"
                  class="input-field"
                  placeholder="Enter student name, admission number, or class..."
                  @input="debouncedSearch"
                />
              </div>
              <div class="flex-shrink-0">
                <label for="searchType" class="block text-sm font-medium text-gray-700 mb-1">
                  Search By
                </label>
                <select
                  id="searchType"
                  v-model="searchType"
                  class="input-field"
                  @change="performSearch"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name</option>
                  <option value="admission">Admission Number</option>
                  <option value="class">Class</option>
                </select>
              </div>
            </div>
            
            <!-- Search Results -->
            <div class="border border-gray-200 rounded-lg">
              <!-- Loading State -->
              <div v-if="isSearching" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p class="text-sm text-gray-600">Searching students...</p>
              </div>
              
              <!-- No Results -->
              <div v-else-if="searchResults.length === 0 && searchQuery" class="text-center py-8">
                <UserIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p class="text-gray-500">No students found matching your search</p>
                <p class="text-sm text-gray-400 mt-1">Try different search terms or check spelling</p>
              </div>
              
              <!-- Results List -->
              <div v-else-if="searchResults.length > 0" class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                <div
                  v-for="student in searchResults"
                  :key="student.adm"
                  :class="[
                    'p-4 cursor-pointer transition-colors duration-200',
                    selectedStudent?.adm === student.adm
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50'
                  ]"
                  @click="selectStudent(student)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span class="text-sm font-medium text-gray-600">
                            {{ student.name1.charAt(0) }}{{ student.name2.charAt(0) }}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center space-x-2">
                          <h4 class="text-sm font-medium text-gray-900">
                            {{ student.name1 }} {{ student.name2 }} {{ student.name3 || '' }}
                          </h4>
                          <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ADM: {{ student.adm }}
                          </span>
                        </div>
                        <div class="flex items-center space-x-4 mt-1">
                          <span class="text-xs text-gray-500">
                            Class {{ student.class }}{{ student.stream ? ` Stream ${student.stream}` : '' }}
                          </span>
                          <span class="text-xs text-gray-500">
                            Current Balance: KSh {{ student.currentBalance.toLocaleString() }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex-shrink-0">
                      <CheckCircleIcon
                        v-if="selectedStudent?.adm === student.adm"
                        class="h-5 w-5 text-primary-600"
                      />
                      <div
                        v-else
                        class="h-5 w-5 border-2 border-gray-300 rounded-full"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Initial State -->
              <div v-else class="text-center py-8">
                <MagnifyingGlassIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p class="text-gray-500">Start typing to search for students</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="confirmSelection"
            :disabled="!selectedStudent"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Student
          </button>
          <button
            @click="$emit('close')"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { studentApi } from '@/services/api'
import { useToast } from 'vue-toastification'
import type { ExtractedPayment, StudentMatch } from '@/types'
import {
  XMarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  payment: ExtractedPayment | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  studentSelected: [student: StudentMatch]
  close: []
}>()

// State
const toast = useToast()
const searchQuery = ref('')
const searchType = ref('all')
const isSearching = ref(false)
const searchResults = ref<StudentMatch[]>([])
const selectedStudent = ref<StudentMatch | null>(null)

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  try {
    const response = await studentApi.search(
      searchQuery.value.trim(),
      searchType.value,
      20 // Limit results
    )
    
    if (response.success && response.data) {
      searchResults.value = response.data.students
    } else {
      throw new Error(response.error?.message || 'Search failed')
    }
  } catch (error) {
    console.error('Search error:', error)
    toast.error('Failed to search students')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const selectStudent = (student: StudentMatch) => {
  selectedStudent.value = student
}

const confirmSelection = () => {
  if (selectedStudent.value) {
    emit('studentSelected', selectedStudent.value)
  }
}

// Auto-search based on payment info
onMounted(() => {
  if (props.payment) {
    searchQuery.value = props.payment.studentName
    performSearch()
  }
})
</script>