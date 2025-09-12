<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Student Matching</h3>
          <p class="text-sm text-gray-500 mt-1">
            Match extracted payments with students in the database
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">
            {{ matchedCount }}/{{ totalPayments }} matched
          </span>
          <button
            @click="matchAll"
            class="btn-primary text-sm"
            :disabled="isMatching"
          >
            <MagnifyingGlassIcon class="h-4 w-4 mr-1" />
            {{ isMatching ? 'Matching...' : 'Match All' }}
          </button>
        </div>
      </div>
    </div>

    <div class="divide-y divide-gray-200">
      <div
        v-for="(payment, index) in payments"
        :key="payment.id"
        class="p-6"
      >
        <div class="flex items-start space-x-4">
          <!-- Payment Info -->
          <div class="flex-shrink-0 w-64">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-900">Payment #{{ index + 1 }}</span>
                <span :class="getPaymentStatusClass(payment)">
                  {{ getPaymentStatusText(payment) }}
                </span>
              </div>
              <div class="space-y-1 text-sm text-gray-600">
                <div><strong>Amount:</strong> KSh {{ payment.amount.toLocaleString() }}</div>
                <div><strong>Ref:</strong> {{ payment.transactionRef }}</div>
                <div><strong>Name:</strong> {{ payment.studentName }}</div>
                <div><strong>Class:</strong> {{ payment.className }}</div>
              </div>
            </div>
          </div>

          <!-- Matching Results -->
          <div class="flex-1">
            <!-- Loading State -->
            <div v-if="matchingStates[payment.id]" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p class="text-sm text-gray-600">Finding matches...</p>
            </div>

            <!-- No Matches -->
            <div v-else-if="!paymentMatches[payment.id] || paymentMatches[payment.id].length === 0" class="text-center py-8">
              <UserIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-500 mb-4">No automatic matches found</p>
              <button
                @click="openManualSearch(payment)"
                class="btn-secondary text-sm"
              >
                <MagnifyingGlassIcon class="h-4 w-4 mr-1" />
                Manual Search
              </button>
            </div>

            <!-- Match Results -->
            <div v-else class="space-y-3">
              <div
                v-for="match in paymentMatches[payment.id]"
                :key="match.student.adm"
                :class="[
                  'border rounded-lg p-4 cursor-pointer transition-colors duration-200',
                  selectedMatches[payment.id]?.adm === match.student.adm
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
                @click="selectMatch(payment.id, match)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span class="text-sm font-medium text-gray-600">
                            {{ match.student.name1.charAt(0) }}{{ match.student.name2.charAt(0) }}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <h4 class="text-sm font-medium text-gray-900">
                            {{ match.student.name1 }} {{ match.student.name2 }} {{ match.student.name3 || '' }}
                          </h4>
                          <span class="text-xs text-gray-500">
                            ADM: {{ match.student.adm }}
                          </span>
                        </div>
                        <div class="flex items-center space-x-4 mt-1">
                          <span class="text-xs text-gray-500">
                            Class {{ match.student.class }}
                          </span>
                          <span class="text-xs text-gray-500">
                            Balance: KSh {{ match.student.currentBalance.toLocaleString() }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <!-- Match Confidence -->
                    <div class="text-right">
                      <div class="text-xs text-gray-500 mb-1">Match Score</div>
                      <div class="flex items-center space-x-2">
                        <div class="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            :class="[
                              'h-2 rounded-full transition-all duration-300',
                              getMatchScoreColor(match.matchScore)
                            ]"
                            :style="{ width: `${match.matchScore * 100}%` }"
                          ></div>
                        </div>
                        <span class="text-xs text-gray-600 w-8">
                          {{ Math.round(match.matchScore * 100) }}%
                        </span>
                      </div>
                    </div>

                    <!-- Selection Indicator -->
                    <div class="flex-shrink-0">
                      <CheckCircleIcon
                        v-if="selectedMatches[payment.id]?.adm === match.student.adm"
                        class="h-5 w-5 text-primary-600"
                      />
                      <div
                        v-else
                        class="h-5 w-5 border-2 border-gray-300 rounded-full"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Match Reasons -->
                <div v-if="match.matchReasons.length > 0" class="mt-3 pt-3 border-t border-gray-100">
                  <div class="text-xs text-gray-500 mb-1">Match Reasons:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="reason in match.matchReasons"
                      :key="reason"
                      class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                    >
                      {{ reason }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Manual Search Option -->
              <div class="pt-3 border-t border-gray-200">
                <button
                  @click="openManualSearch(payment)"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <MagnifyingGlassIcon class="h-4 w-4 mr-1 inline" />
                  Search for different student
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Search Modal -->
    <ManualSearchModal
      v-if="showManualSearch"
      :payment="selectedPayment"
      @student-selected="handleManualSelection"
      @close="closeManualSearch"
    />

    <!-- Actions Footer -->
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          {{ matchedCount }} of {{ totalPayments }} payments matched
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="clearAllMatches"
            class="btn-secondary text-sm"
          >
            Clear All
          </button>
          <button
            @click="proceedToConfirmation"
            class="btn-primary text-sm"
            :disabled="matchedCount === 0"
          >
            <ArrowRightIcon class="h-4 w-4 mr-1" />
            Proceed to Confirmation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { studentApi } from '@/services/api'
import { useToast } from 'vue-toastification'
import type { ExtractedPayment, StudentMatch } from '@/types'
import {
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'
import ManualSearchModal from './ManualSearchModal.vue'

// Props
interface Props {
  payments: ExtractedPayment[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  matchingComplete: [matches: Record<string, StudentMatch>]
}>()

// Types
interface MatchResult {
  student: StudentMatch
  matchScore: number
  matchReasons: string[]
}

// State
const toast = useToast()
const isMatching = ref(false)
const matchingStates = ref<Record<string, boolean>>({})
const paymentMatches = ref<Record<string, MatchResult[]>>({})
const selectedMatches = ref<Record<string, StudentMatch>>({})
const showManualSearch = ref(false)
const selectedPayment = ref<ExtractedPayment | null>(null)

// Computed
const totalPayments = computed(() => props.payments.length)
const matchedCount = computed(() => Object.keys(selectedMatches.value).length)

// Methods
const matchAll = async () => {
  isMatching.value = true
  
  try {
    const response = await studentApi.matchStudents(
      props.payments.map(p => ({
        id: p.id,
        studentName: p.studentName,
        className: p.className,
        amount: p.amount,
        transactionRef: p.transactionRef
      })),
      0.3 // Match threshold
    )

    if (response.success && response.data) {
      // Process matching results
      response.data.results.forEach((result: any) => {
        if (result.matches && result.matches.length > 0) {
          paymentMatches.value[result.paymentId] = result.matches
          
          // Auto-select best match if confidence is high
          const bestMatch = result.bestMatch
          if (bestMatch && bestMatch.matchScore >= 0.8) {
            selectedMatches.value[result.paymentId] = bestMatch.student
          }
        }
      })

      toast.success(`Found matches for ${response.data.summary.matchedPayments} payments`)
    } else {
      throw new Error(response.error?.message || 'Matching failed')
    }
  } catch (error) {
    console.error('Matching error:', error)
    toast.error('Failed to match students')
  } finally {
    isMatching.value = false
  }
}

const selectMatch = (paymentId: string, match: MatchResult) => {
  selectedMatches.value[paymentId] = match.student
}

const openManualSearch = (payment: ExtractedPayment) => {
  selectedPayment.value = payment
  showManualSearch.value = true
}

const closeManualSearch = () => {
  showManualSearch.value = false
  selectedPayment.value = null
}

const handleManualSelection = (student: StudentMatch) => {
  if (selectedPayment.value) {
    selectedMatches.value[selectedPayment.value.id] = student
    
    // Add to matches list for display
    if (!paymentMatches.value[selectedPayment.value.id]) {
      paymentMatches.value[selectedPayment.value.id] = []
    }
    
    // Check if student is already in matches
    const existingMatch = paymentMatches.value[selectedPayment.value.id].find(
      m => m.student.adm === student.adm
    )
    
    if (!existingMatch) {
      paymentMatches.value[selectedPayment.value.id].unshift({
        student,
        matchScore: 1.0, // Manual selection gets perfect score
        matchReasons: ['Manual selection']
      })
    }
  }
  
  closeManualSearch()
}

const clearAllMatches = () => {
  selectedMatches.value = {}
  paymentMatches.value = {}
}

const proceedToConfirmation = () => {
  emit('matchingComplete', selectedMatches.value)
}

// Styling methods
const getPaymentStatusClass = (payment: ExtractedPayment) => {
  if (selectedMatches.value[payment.id]) {
    return 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
  }
  return 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
}

const getPaymentStatusText = (payment: ExtractedPayment) => {
  return selectedMatches.value[payment.id] ? 'Matched' : 'Pending'
}

const getMatchScoreColor = (score: number) => {
  if (score >= 0.8) return 'bg-green-500'
  if (score >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Auto-match on mount
onMounted(() => {
  if (props.payments.length > 0) {
    matchAll()
  }
})
</script>