<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Search Student</h2>
    
    <!-- Search Input -->
    <div class="mb-4">
      <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
        Search by admission number, name, or class
      </label>
      <div class="relative">
        <input
          id="search"
          v-model="searchQuery"
          type="text"
          placeholder="Enter admission number, name, or class..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="handleSearch"
        />
        <div v-if="searching" class="absolute right-3 top-2">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="mb-4">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
      <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
        <div
          v-for="student in searchResults"
          :key="student.adm"
          class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          @click="selectStudent(student)"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-gray-900">{{ getFullName(student) }}</p>
              <p class="text-sm text-gray-600">{{ student.adm }} • {{ student.class_name }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium" :class="student.balance > 0 ? 'text-red-600' : 'text-green-600'">
                KSh {{ formatAmount(student.balance) }}
              </p>
              <p class="text-xs text-gray-500">Balance</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Student -->
    <div v-if="selectedStudent" class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h3 class="text-sm font-medium text-blue-900 mb-2">Selected Student</h3>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-sm text-blue-700">Name:</span>
          <span class="text-sm font-medium text-blue-900">{{ getFullName(selectedStudent) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-blue-700">Admission No:</span>
          <span class="text-sm font-medium text-blue-900">{{ selectedStudent.adm }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-blue-700">Class:</span>
          <span class="text-sm font-medium text-blue-900">{{ selectedStudent.class_name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-blue-700">Current Balance:</span>
          <span class="text-sm font-medium" :class="selectedStudent.balance > 0 ? 'text-red-600' : 'text-green-600'">
            KSh {{ formatAmount(selectedStudent.balance) }}
          </span>
        </div>
      </div>
      <button
        @click="clearSelection"
        class="mt-3 w-full px-3 py-2 text-sm text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Clear Selection
      </button>
    </div>

    <!-- No Results -->
    <div v-if="searchQuery && !searching && searchResults.length === 0" class="text-center py-4">
      <p class="text-gray-500">No students found matching "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/services/api'

interface Student {
  adm: number
  name1: string
  name2: string
  name3: string
  balance: number
  class: number
  paycount: number
  class_name: string
}

interface Props {
  selectedStudent?: Student | null
}

interface Emits {
  (e: 'student-selected', student: Student): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const searchResults = ref<Student[]>([])
const searching = ref(false)
let searchTimeout: number | null = null

const handleSearch = () => {
  if (searchTimeout) {
    window.clearTimeout(searchTimeout)
  }

  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }

  searchTimeout = window.setTimeout(async () => {
    await searchStudents()
  }, 300)
}

const searchStudents = async () => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  try {
    const response = await api.get<Student[]>('/manual-fees/students/search', {
      params: { query: searchQuery.value.trim() }
    })
    if (response.success && response.data) {
      searchResults.value = response.data
    }
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const selectStudent = (student: Student) => {
  emit('student-selected', student)
  searchResults.value = []
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('student-selected', null as any)
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
}

const getFullName = (student: Student) => {
  return [student.name1, student.name2, student.name3]
    .filter(name => name && name !== '.')
    .join(' ')
}

// Watch for external selection changes
watch(() => props.selectedStudent, (newStudent) => {
  if (!newStudent) {
    searchQuery.value = ''
    searchResults.value = []
  }
})
</script>