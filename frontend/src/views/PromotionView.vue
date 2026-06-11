<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <ArrowsUpDownIcon class="h-8 w-8 mr-3 text-primary-600" />
              Student Promotion
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Promote students to the next class at the end of the academic year
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="loadPreview"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100">
              <UserGroupIcon class="h-6 w-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Students</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalStudents }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100">
              <ArrowUpIcon class="h-6 w-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">To Promote</p>
              <p class="text-2xl font-bold text-green-600">{{ preview?.totalToPromote || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-orange-100">
              <AcademicCapIcon class="h-6 w-6 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Graduating</p>
              <p class="text-2xl font-bold text-orange-600">{{ preview?.totalToTransfer || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100">
              <BuildingLibraryIcon class="h-6 w-6 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Classes</p>
              <p class="text-2xl font-bold text-gray-900">{{ preview?.classes?.length || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Promotion Preview Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Promotion Preview</h2>
          <p class="text-sm text-gray-500">Review the promotion plan before executing</p>
        </div>

        <div v-if="loading" class="p-12 text-center">
          <ArrowPathIcon class="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p class="mt-2 text-gray-500">Loading promotion preview...</p>
        </div>

        <div v-else-if="error" class="p-12 text-center">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
          <p class="mt-2 text-red-600">{{ error }}</p>
          <button @click="loadPreview" class="mt-4 text-primary-600 hover:underline">
            Try again
          </button>
        </div>

        <div v-else-if="preview?.classes?.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Class
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(cls, index) in preview.classes" :key="index" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                      <span class="text-primary-700 font-medium text-sm">{{ getClassInitials(cls.className) }}</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ cls.className }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ cls.currentStudents }} students
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      cls.action === 'transfer' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    ]"
                  >
                    <component 
                      :is="cls.action === 'transfer' ? AcademicCapIcon : ArrowUpIcon" 
                      class="h-3 w-3 mr-1" 
                    />
                    {{ cls.action === 'transfer' ? 'Graduate & Transfer' : 'Promote' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span v-if="cls.action === 'transfer'" class="text-orange-600 font-medium">
                    → Transferred Students
                  </span>
                  <span v-else class="text-green-600 font-medium">
                    → {{ cls.nextClass }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        class="h-full rounded-full"
                        :class="cls.action === 'transfer' ? 'bg-orange-500' : 'bg-green-500'"
                        :style="{ width: `${Math.min(100, (cls.currentStudents / maxStudents) * 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-12 text-center text-gray-500">
          <UserGroupIcon class="h-12 w-12 mx-auto text-gray-300" />
          <p class="mt-2">No classes found</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Execute Promotion</h3>
            <p class="text-sm text-gray-500 mt-1">
              This action will promote all students to the next class. Graduating students will be moved to the transferred students list.
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              v-if="!showConfirmation"
              @click="showConfirmation = true"
              :disabled="!canPromote || promoting"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowsUpDownIcon class="h-5 w-5 mr-2" />
              Promote All Students
            </button>
          </div>
        </div>

        <!-- Confirmation Dialog -->
        <div v-if="showConfirmation" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex">
            <ExclamationTriangleIcon class="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <div class="ml-3">
              <h4 class="text-sm font-medium text-yellow-800">Confirm Promotion</h4>
              <p class="mt-2 text-sm text-yellow-700">
                Are you sure you want to promote all students? This will:
              </p>
              <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Promote <strong>{{ preview?.totalToPromote }}</strong> students to the next class</li>
                <li>Transfer <strong>{{ preview?.totalToTransfer }}</strong> graduating students to the transferred list</li>
                <li>Update student fees based on new class</li>
              </ul>
              <div class="mt-4 flex space-x-3">
                <button
                  @click="executePromotion"
                  :disabled="promoting"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <CheckIcon v-if="!promoting" class="h-4 w-4 mr-2" />
                  <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                  {{ promoting ? 'Promoting...' : 'Yes, Promote All' }}
                </button>
                <button
                  @click="showConfirmation = false"
                  :disabled="promoting"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="result && result.success" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex">
            <CheckCircleIcon class="h-6 w-6 text-green-400 flex-shrink-0" />
            <div class="ml-3">
              <h4 class="text-sm font-medium text-green-800">Promotion Completed Successfully!</h4>
              <div class="mt-2 text-sm text-green-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Total students processed: <strong>{{ result.summary.totalStudents }}</strong></li>
                  <li>Students promoted: <strong>{{ result.summary.promoted }}</strong></li>
                  <li>Students transferred: <strong>{{ result.summary.transferred }}</strong></li>
                  <li v-if="result.summary.failed > 0" class="text-red-600">
                    Failed: <strong>{{ result.summary.failed }}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="result && !result.success" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex">
            <XCircleIcon class="h-6 w-6 text-red-400 flex-shrink-0" />
            <div class="ml-3">
              <h4 class="text-sm font-medium text-red-800">Promotion Failed</h4>
              <p class="mt-2 text-sm text-red-700">{{ result.message }}</p>
              <ul v-if="result.summary?.errors?.length" class="mt-2 text-sm text-red-700 list-disc list-inside">
                <li v-for="(err, i) in result.summary.errors.slice(0, 5)" :key="i">{{ err }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import {
  ArrowsUpDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

interface ClassPreview {
  className: string
  currentStudents: number
  action: 'promote' | 'transfer'
  nextClass?: string
}

interface Preview {
  classes: ClassPreview[]
  totalToPromote: number
  totalToTransfer: number
}

interface PromotionResult {
  success: boolean
  message: string
  summary: {
    totalStudents: number
    promoted: number
    transferred: number
    failed: number
    errors: string[]
  }
}

const loading = ref(false)
const promoting = ref(false)
const error = ref('')
const preview = ref<Preview | null>(null)
const showConfirmation = ref(false)
const result = ref<PromotionResult | null>(null)

const totalStudents = computed(() => {
  if (!preview.value?.classes) return 0
  return preview.value.classes.reduce((sum, cls) => sum + cls.currentStudents, 0)
})

const maxStudents = computed(() => {
  if (!preview.value?.classes) return 1
  return Math.max(...preview.value.classes.map(cls => cls.currentStudents), 1)
})

const canPromote = computed(() => {
  return preview.value && totalStudents.value > 0 && !loading.value
})

const getClassInitials = (className: string) => {
  const words = className.split(' ')
  if (words.length >= 2) {
    return words[0][0] + words[1][0]
  }
  return className.substring(0, 2).toUpperCase()
}

const loadPreview = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await api.get('/promotion/preview')
    if (response.data.success) {
      preview.value = response.data.data
    } else {
      error.value = response.data.message || 'Failed to load preview'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load preview'
  } finally {
    loading.value = false
  }
}

const executePromotion = async () => {
  promoting.value = true
  result.value = null
  
  try {
    const response = await api.post('/promotion/promote-all', { confirm: true })
    result.value = {
      success: response.data.success,
      message: response.data.message,
      summary: response.data.data
    }
    
    if (response.data.success) {
      showConfirmation.value = false
      // Reload preview to show updated state
      await loadPreview()
    }
  } catch (err: any) {
    result.value = {
      success: false,
      message: err.response?.data?.message || err.message || 'Promotion failed',
      summary: {
        totalStudents: 0,
        promoted: 0,
        transferred: 0,
        failed: 0,
        errors: [err.message]
      }
    }
  } finally {
    promoting.value = false
  }
}

onMounted(() => {
  loadPreview()
})
</script>
