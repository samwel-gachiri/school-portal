<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">Classes Management</h1>
        <p class="mt-2 text-sm text-gray-700">
          A list of all classes, their respective fees, streams, and the cumulative student balance in each class.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="exportToExcel"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
        >
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
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Class Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Base Fees</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cumulative Balance</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Streams</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="loading">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    Loading classes...
                  </td>
                </tr>
                <tr v-else-if="classes.length === 0">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    No classes found.
                  </td>
                </tr>
                <tr v-for="cls in classes" :key="cls.class_id" @click="openClassDetails(cls)" class="cursor-pointer hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ cls.name.replace(/_/g, ' ') }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatCurrency(cls.fees) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="cls.cumulative_balance > 0 ? 'text-red-600 font-semibold' : 'text-gray-900'">
                      {{ formatCurrency(cls.cumulative_balance) }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-sm text-gray-500 truncate max-w-xs">
                    {{ cls.streams || 'None' }}
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()
const classes = ref<any[]>([])
const loading = ref(false)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(value)
}

const fetchClasses = async () => {
  loading.value = true
  try {
    const response = await api.get<any>('/classes')
    if (response.success) {
      classes.value = response.data
    }
  } catch (error: any) {
    console.error('Failed to fetch classes:', error)
    toast.error('Failed to load classes')
  } finally {
    loading.value = false
  }
}

const openClassDetails = (cls: any) => {
  router.push('/admin/classes/' + cls.class_id)
}

const exportToExcel = async () => {
  if (!classes.value.length) {
    toast.warning('No data to export')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Little Angels Academy'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Classes', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }] // Freeze top 5 rows
    })

    // 1. Title Row
    sheet.mergeCells('A1:D1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'LITTLE ANGELS ACADEMY'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } } // blue-900
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 2. Subtitle Row
    sheet.mergeCells('A2:D2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = 'Overall Class Balances'
    subtitleCell.font = { name: 'Arial', size: 12, bold: true }
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 3. Date Row
    sheet.mergeCells('A3:D3')
    const dateCell = sheet.getCell('A3')
    dateCell.value = `Generated on: ${new Date().toLocaleDateString('en-GB')}`
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } }
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' }

    // 4. Empty Row
    sheet.addRow([])

    // 5. Header Row
    const headerRow = sheet.addRow(['Class Name', 'Base Fees', 'Cumulative Balance', 'Streams'])
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
      { key: 'name', width: 25 },
      { key: 'fees', width: 20 },
      { key: 'balance', width: 25 },
      { key: 'streams', width: 40 }
    ]

    // Add data rows
    classes.value.forEach((cls: any, index: number) => {
      const row = sheet.addRow([
        cls.name.replace(/_/g, ' '),
        cls.fees,
        cls.cumulative_balance,
        cls.streams || 'None'
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
        if (colNumber === 2 || colNumber === 3) {
          // KES Currency format
          cell.numFmt = '"KES" #,##0.00;[Red]-"KES" #,##0.00'
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
          
          if (colNumber === 3 && cls.cumulative_balance > 0) {
            cell.font = { color: { argb: 'FFDC2626' }, bold: true } // red-600
          }
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
    sheet.autoFilter = 'A5:D5'

    // Write to browser
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Class_Balances_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    toast.success('Enterprise Excel file generated successfully')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to generate Excel file')
  }
}

onMounted(() => {
  fetchClasses()
})
</script>
