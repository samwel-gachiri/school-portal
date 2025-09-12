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
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              File Preview
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              <strong>Name:</strong> {{ file?.name }}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Size:</strong> {{ formatFileSize(file?.size || 0) }}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Type:</strong> {{ file?.type }}
            </p>
          </div>
          
          <!-- Image Preview -->
          <div v-if="isImage" class="flex justify-center">
            <img
              :src="previewUrl"
              :alt="file?.name"
              class="max-w-full max-h-96 object-contain border border-gray-200 rounded"
            />
          </div>
          
          <!-- PDF Preview -->
          <div v-else-if="isPDF" class="text-center">
            <DocumentIcon class="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600">PDF preview not available</p>
            <p class="text-sm text-gray-500 mt-2">
              The file will be processed when uploaded
            </p>
          </div>
          
          <!-- Other file types -->
          <div v-else class="text-center">
            <DocumentIcon class="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600">Preview not available for this file type</p>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="$emit('close')"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { XMarkIcon, DocumentIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  file: File | null
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  close: []
}>()

// State
const previewUrl = ref<string | null>(null)

// Computed
const isImage = computed(() => {
  return props.file?.type.startsWith('image/') || false
})

const isPDF = computed(() => {
  return props.file?.type === 'application/pdf' || false
})

// Methods
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const createPreviewUrl = () => {
  if (props.file && isImage.value) {
    previewUrl.value = URL.createObjectURL(props.file)
  }
}

const revokePreviewUrl = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

// Lifecycle
onMounted(() => {
  createPreviewUrl()
})

onUnmounted(() => {
  revokePreviewUrl()
})
</script>