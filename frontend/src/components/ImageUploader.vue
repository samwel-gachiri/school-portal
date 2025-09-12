<template>
  <div class="w-full">
    <!-- Upload Area -->
    <div
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
      @dragleave="handleDragLeave"
      :class="[
        'relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200',
        isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
        isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary-400'
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*,.pdf"
        @change="handleFileSelect"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        :disabled="isUploading"
      />
      
      <div class="text-center">
        <CloudArrowUpIcon 
          :class="[
            'mx-auto h-12 w-12',
            isDragOver ? 'text-primary-500' : 'text-gray-400'
          ]" 
        />
        
        <div class="mt-4">
          <p class="text-lg font-medium text-gray-900">
            {{ isDragOver ? 'Drop your file here' : 'Upload bank statement' }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Drag and drop or click to select
          </p>
          <p class="text-xs text-gray-400 mt-2">
            Supports JPG, PNG, PDF (max {{ maxFileSizeMB }}MB)
          </p>
        </div>
        
        <!-- Upload Progress -->
        <div v-if="isUploading" class="mt-4">
          <div class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span class="text-sm text-gray-600">
              Uploading... {{ uploadProgress }}%
            </span>
          </div>
          <div class="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- File Preview -->
    <div v-if="selectedFile && !isUploading" class="mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <DocumentIcon class="h-8 w-8 text-gray-400" />
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedFile.name }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatFileSize(selectedFile.size) }} • {{ selectedFile.type }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="previewFile"
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Preview
          </button>
          <button
            @click="removeFile"
            class="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
    
    <!-- Upload Error -->
    <div v-if="uploadError" class="mt-4 p-4 bg-red-50 rounded-lg">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
          <p class="text-sm text-red-700 mt-1">{{ uploadError }}</p>
        </div>
        <button
          @click="clearError"
          class="ml-auto text-red-400 hover:text-red-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
    
    <!-- Upload Success -->
    <div v-if="uploadedFile" class="mt-4 p-4 bg-green-50 rounded-lg">
      <div class="flex">
        <CheckCircleIcon class="h-5 w-5 text-green-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800">Upload Successful</h3>
          <p class="text-sm text-green-700 mt-1">
            File uploaded successfully. Ready for processing.
          </p>
        </div>
      </div>
    </div>
    
    <!-- File Preview Modal -->
    <FilePreviewModal
      v-if="showPreview"
      :file="selectedFile"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadApi } from '@/services/api'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import FilePreviewModal from './FilePreviewModal.vue'

// Props
interface Props {
  maxFileSize?: number // in bytes
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 10 * 1024 * 1024 // 10MB default
})

// Emits
const emit = defineEmits<{
  fileUploaded: [file: { fileId: string; originalName: string; base64Data: string }]
  uploadError: [error: string]
}>()

// State
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const uploadedFile = ref<any>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)
const isDragOver = ref(false)
const showPreview = ref(false)

// Computed
const maxFileSizeMB = computed(() => Math.round(props.maxFileSize / 1024 / 1024))

// Methods
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Only set isDragOver to false if we're leaving the drop zone entirely
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleFile = async (file: File) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Invalid file type. Please select a JPG, PNG, or PDF file.'
    return
  }
  
  // Validate file size
  if (file.size > props.maxFileSize) {
    uploadError.value = `File size exceeds ${maxFileSizeMB.value}MB limit.`
    return
  }
  
  selectedFile.value = file
  uploadError.value = null
  uploadedFile.value = null
  
  // Automatically start upload
  await uploadFile()
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  uploadError.value = null
  
  try {
    const response = await uploadApi.uploadImage(
      selectedFile.value,
      (progress) => {
        uploadProgress.value = progress
      }
    )
    
    if (response.success && response.data) {
      uploadedFile.value = response.data
      emit('fileUploaded', response.data)
    } else {
      throw new Error(response.error?.message || 'Upload failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    uploadError.value = errorMessage
    emit('uploadError', errorMessage)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const removeFile = () => {
  selectedFile.value = null
  uploadedFile.value = null
  uploadError.value = null
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const previewFile = () => {
  if (selectedFile.value) {
    showPreview.value = true
  }
}

const clearError = () => {
  uploadError.value = null
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Expose methods for parent component
defineExpose({
  uploadFile,
  removeFile,
  hasFile: computed(() => !!selectedFile.value),
  isUploading: computed(() => isUploading.value)
})
</script>