<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div class="sm:flex-auto">
        <button @click="goBack" class="mb-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-900">
          <svg class="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Classes
        </button>
        <h1 class="text-2xl font-bold text-gray-900">
          <span v-if="loadingClass">Loading class...</span>
          <span v-else-if="selectedClass">Students in {{ selectedClass.name.replace(/_/g, ' ') }}</span>
          <span v-else>Class Not Found</span>
        </h1>
        <p v-if="selectedClass" class="mt-2 text-sm text-gray-700">
          Base Fees: {{ formatCurrency(selectedClass.fees) }} | Streams: {{ selectedClass.streams || 'None' }}
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none" v-if="selectedClass">
        <button
          @click="exportClassStudentsToExcel"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print to Excel
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">#</th>
                  <th scope="col" class="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors" @click="sortBy('adm')">
                    <div class="flex items-center">
                      Adm
                      <span v-if="sortColumn === 'adm'" class="ml-1 text-primary-500">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      <span v-else class="ml-1 text-gray-300 opacity-50">↕</span>
                    </div>
                  </th>
                  <th scope="col" class="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors" @click="sortBy('name')">
                    <div class="flex items-center">
                      Name
                      <span v-if="sortColumn === 'name'" class="ml-1 text-primary-500">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      <span v-else class="ml-1 text-gray-300 opacity-50">↕</span>
                    </div>
                  </th>
                  <th scope="col" class="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors" @click="sortBy('stream')">
                    <div class="flex items-center">
                      Stream
                      <span v-if="sortColumn === 'stream'" class="ml-1 text-primary-500">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      <span v-else class="ml-1 text-gray-300 opacity-50">↕</span>
                    </div>
                  </th>
                  <th scope="col" class="cursor-pointer px-3 py-3.5 text-right text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors" @click="sortBy('balance')">
                    <div class="flex items-center justify-end">
                      Balance
                      <span v-if="sortColumn === 'balance'" class="ml-1 text-primary-500">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      <span v-else class="ml-1 text-gray-300 opacity-50">↕</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="loadingStudents">
                  <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                    Loading students...
                  </td>
                </tr>
                <tr v-else-if="sortedStudents.length === 0">
                  <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                    No students found in this class.
                  </td>
                </tr>
                <tr v-for="(student, index) in sortedStudents" :key="student.adm" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{{ index + 1 }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{{ student.adm }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ student.name1 }} {{ student.name2 }} {{ student.name3 || '' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ student.stream_name || '-' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                    <span :class="student.balance > 0 ? 'text-red-600' : 'text-gray-900'">
                      {{ formatCurrency(student.balance) }}
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const classId = route.params.classId as string

const selectedClass = ref<any>(null)
const classStudents = ref<any[]>([])
const loadingClass = ref(true)
const loadingStudents = ref(true)

const sortColumn = ref<string>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortedStudents = computed(() => {
  return [...classStudents.value].sort((a, b) => {
    let valA: any = ''
    let valB: any = ''

    if (sortColumn.value === 'adm') {
      valA = a.adm || 0
      valB = b.adm || 0
    } else if (sortColumn.value === 'name') {
      valA = `${a.name1} ${a.name2} ${a.name3 || ''}`.trim().toLowerCase()
      valB = `${b.name1} ${b.name2} ${b.name3 || ''}`.trim().toLowerCase()
    } else if (sortColumn.value === 'stream') {
      valA = (a.stream_name || '').toLowerCase()
      valB = (b.stream_name || '').toLowerCase()
    } else if (sortColumn.value === 'balance') {
      valA = a.balance || 0
      valB = b.balance || 0
    }

    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(value)
}

const goBack = () => {
  router.push('/admin/classes')
}

const fetchClassDetails = async () => {
  loadingClass.value = true
  try {
    const response = await api.get<any>(`/classes/${classId}`)
    if (response.success && response.data) {
      selectedClass.value = response.data
    } else {
      toast.error('Class not found')
      router.push('/admin/classes')
    }
  } catch (error: any) {
    console.error('Failed to fetch class:', error)
    toast.error('Failed to load class details')
  } finally {
    loadingClass.value = false
  }
}

const fetchClassStudents = async () => {
  loadingStudents.value = true
  try {
    const response = await api.get<any>(`/classes/${classId}/students`)
    if (response.success) {
      classStudents.value = response.data
    }
  } catch (error: any) {
    console.error('Failed to fetch class students:', error)
    toast.error('Failed to load students for this class')
  } finally {
    loadingStudents.value = false
  }
}

const exportClassStudentsToExcel = async () => {
  if (!classStudents.value.length) {
    toast.warning('No students to export')
    return
  }

  try {
    const className = selectedClass.value.name.replace(/_/g, ' ')
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Little Angels Academy'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Students', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }] // Freeze top 5 rows
    })

    // 1. Title Row
    sheet.mergeCells('A1:E1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'LITTLE ANGELS ACADEMY'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } } // blue-900
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 2. Subtitle Row
    sheet.mergeCells('A2:E2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = `Student Balances - ${className}`
    subtitleCell.font = { name: 'Arial', size: 12, bold: true }
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 3. Date Row
    sheet.mergeCells('A3:E3')
    const dateCell = sheet.getCell('A3')
    dateCell.value = `Generated on: ${new Date().toLocaleDateString('en-GB')}`
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } }
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' }

    // 4. Empty Row
    sheet.addRow([])

    // 5. Header Row
    const headerRow = sheet.addRow(['#', 'Admission No', 'Name', 'Stream', 'Balance'])
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } } // indigo-600
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Define column widths
    sheet.columns = [
      { key: 'index', width: 6 },
      { key: 'adm', width: 15 },
      { key: 'name', width: 35 },
      { key: 'stream', width: 18 },
      { key: 'balance', width: 20 }
    ]

    // Add data rows
    sortedStudents.value.forEach((student: any, index: number) => {
      const row = sheet.addRow([
        index + 1,
        student.adm,
        `${student.name1} ${student.name2} ${student.name3 || ''}`.trim(),
        student.stream_name || 'None',
        student.balance
      ])

      row.eachCell((cell, colNumber) => {
        // Apply borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }

        // Alignments and Formatting
        if (colNumber === 5) {
          // Balance formatting: KES Currency format
          cell.numFmt = '"KES" #,##0.00;[Red]-"KES" #,##0.00'
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          // Make balances > 0 explicitly bold/red
          if (student.balance > 0) {
            cell.font = { color: { argb: 'FFDC2626' }, bold: true } // red-600
          }
        } else if (colNumber <= 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }
      })

      // Alternate row backgrounds (striping)
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } // gray-50
        })
      }
    })

    // Add auto-filter
    sheet.autoFilter = 'A5:E5'

    // Write to browser
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${className}_Students_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    toast.success('Enterprise Excel file generated successfully')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to generate Excel file')
  }
}

onMounted(() => {
  fetchClassDetails()
  fetchClassStudents()
})
</script>
