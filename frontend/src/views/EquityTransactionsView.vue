<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <BanknotesIcon class="h-8 w-8 mr-3 text-primary-600" />
              Equity Transactions
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Review and process automated bank transactions
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="syncTransactions"
              :disabled="syncing"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': syncing }" />
              Sync Transactions
            </button>
            <button
              @click="loadTransactions"
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
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase">Total</p>
              <p class="text-xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
            </div>
            <DocumentTextIcon class="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 border border-yellow-200 bg-yellow-50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-yellow-600 uppercase">Pending</p>
              <p class="text-xl font-bold text-yellow-700">{{ stats.pending || 0 }}</p>
            </div>
            <ClockIcon class="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 border border-blue-200 bg-blue-50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-blue-600 uppercase">Matched</p>
              <p class="text-xl font-bold text-blue-700">{{ stats.matched || 0 }}</p>
            </div>
            <CheckIcon class="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 border border-green-200 bg-green-50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-green-600 uppercase">Posted</p>
              <p class="text-xl font-bold text-green-700">{{ stats.posted || 0 }}</p>
            </div>
            <CheckCircleIcon class="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 border border-red-200 bg-red-50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-red-600 uppercase">Rejected</p>
              <p class="text-xl font-bold text-red-700">{{ stats.rejected || 0 }}</p>
            </div>
            <XCircleIcon class="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Pending Transactions</h2>
            <p class="text-sm text-gray-500">Transactions awaiting review and posting</p>
          </div>
          <div class="flex items-center space-x-2">
            <select v-model="filter" class="rounded-md border-gray-300 text-sm">
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="p-12 text-center">
          <ArrowPathIcon class="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p class="mt-2 text-gray-500">Loading transactions...</p>
        </div>

        <div v-else-if="transactions.length === 0" class="p-12 text-center">
          <InboxIcon class="h-12 w-12 text-gray-300 mx-auto" />
          <p class="mt-2 text-gray-500">No pending transactions</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depositor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="tx in transactions" :key="tx.transaction_id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-mono text-sm text-gray-900">{{ tx.transaction_ref }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(tx.transaction_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">KES {{ tx.amount?.toLocaleString() }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ tx.depositor_name || '-' }}</div>
                  <div class="text-xs text-gray-500">{{ tx.depositor_mobile || '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ tx.payment_description || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(tx.status)">
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex space-x-2">
                    <button
                      v-if="tx.status === 'matched'"
                      @click="postTransaction(tx)"
                      class="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      Post
                    </button>
                    <button
                      v-if="tx.status === 'pending'"
                      @click="openMatchModal(tx)"
                      class="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Match
                    </button>
                    <button
                      v-if="tx.status !== 'posted' && tx.status !== 'rejected'"
                      @click="rejectTransaction(tx)"
                      class="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Match Modal -->
    <div v-if="showMatchModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showMatchModal = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Match Transaction to Student</h3>
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm"><strong>Ref:</strong> {{ selectedTransaction?.transaction_ref }}</p>
            <p class="text-sm"><strong>Amount:</strong> KES {{ selectedTransaction?.amount?.toLocaleString() }}</p>
            <p class="text-sm"><strong>Depositor:</strong> {{ selectedTransaction?.depositor_name }}</p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Student ADM Number</label>
            <input
              v-model="matchAdm"
              type="number"
              placeholder="Enter admission number"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div class="flex justify-end space-x-3">
            <button
              @click="showMatchModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="matchTransaction"
              :disabled="!matchAdm"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Match
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'
import {
  BanknotesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxIcon
} from '@heroicons/vue/24/outline'

interface Transaction {
  transaction_id: number
  transaction_ref: string
  transaction_date: string
  amount: number
  currency: string
  depositor_name: string
  depositor_mobile: string
  payment_description: string
  status: string
  matched_student_adm?: number
}

interface Stats {
  total: number
  pending: number
  matched: number
  posted: number
  rejected: number
}

const loading = ref(false)
const syncing = ref(false)
const transactions = ref<Transaction[]>([])
const stats = ref<Stats>({ total: 0, pending: 0, matched: 0, posted: 0, rejected: 0 })
const filter = ref('pending')

const showMatchModal = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const matchAdm = ref('')

const loadTransactions = async () => {
  loading.value = true
  try {
    const [txResponse, statsResponse] = await Promise.all([
      api.get('/equity/transactions/pending'),
      api.get('/equity/stats')
    ])
    
    if (txResponse.data.success) {
      transactions.value = txResponse.data.data
    }
    if (statsResponse.data.success) {
      stats.value = statsResponse.data.data
    }
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loading.value = false
  }
}

const syncTransactions = async () => {
  syncing.value = true
  try {
    await api.post('/equity/sync')
    await loadTransactions()
  } catch (error) {
    console.error('Failed to sync transactions:', error)
  } finally {
    syncing.value = false
  }
}

const openMatchModal = (tx: Transaction) => {
  selectedTransaction.value = tx
  matchAdm.value = ''
  showMatchModal.value = true
}

const matchTransaction = async () => {
  if (!selectedTransaction.value || !matchAdm.value) return
  
  try {
    await api.post(`/equity/transactions/${selectedTransaction.value.transaction_id}/match`, {
      studentAdm: parseInt(matchAdm.value)
    })
    showMatchModal.value = false
    await loadTransactions()
  } catch (error) {
    console.error('Failed to match transaction:', error)
  }
}

const postTransaction = async (tx: Transaction) => {
  if (!confirm('Post this transaction as a payment?')) return
  
  try {
    await api.post(`/equity/transactions/${tx.transaction_id}/post`)
    await loadTransactions()
  } catch (error) {
    console.error('Failed to post transaction:', error)
  }
}

const rejectTransaction = async (tx: Transaction) => {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return
  
  try {
    await api.post(`/equity/transactions/${tx.transaction_id}/reject`, { reason })
    await loadTransactions()
  } catch (error) {
    console.error('Failed to reject transaction:', error)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    matched: 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    posted: 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    rejected: 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  }
  return classes[status] || classes.pending
}

watch(filter, () => {
  loadTransactions()
})

onMounted(() => {
  loadTransactions()
})
</script>
