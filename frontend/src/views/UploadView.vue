<template>
  <AuthGuard>
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Upload Bank Statement</h1>
        <p class="mt-2 text-gray-600">
          Upload a bank statement image for AI-powered payment extraction
        </p>
      </div>
      
      <!-- Upload Steps -->
      <div class="mb-8">
        <nav aria-label="Progress">
          <ol class="flex items-center">
            <li class="relative pr-8 sm:pr-20">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="h-0.5 w-full bg-gray-200"></div>
              </div>
              <div 
                :class="[
                  'relative flex h-8 w-8 items-center justify-center rounded-full cursor-pointer',
                  currentStep >= 1 ? 'bg-primary-600' : 'bg-gray-200'
                ]"
                @click="goToUploadStep"
              >
                <span 
                  :class="[
                    'text-sm font-medium',
                    currentStep >= 1 ? 'text-white' : 'text-gray-500'
                  ]"
                >
                  1
                </span>
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Upload</span>
            </li>
            
            <li class="relative pr-8 sm:pr-20">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="h-0.5 w-full bg-gray-200"></div>
              </div>
              <div 
                :class="[
                  'relative flex h-8 w-8 items-center justify-center rounded-full cursor-pointer',
                  currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
                ]"
                @click="uploadedFile ? goToConfigureStep() : null"
              >
                <span 
                  :class="[
                    'text-sm font-medium',
                    currentStep >= 2 ? 'text-white' : 'text-gray-500'
                  ]"
                >
                  2
                </span>
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Configure</span>
            </li>
            
            <li class="relative">
              <div 
                :class="[
                  'relative flex h-8 w-8 items-center justify-center rounded-full cursor-pointer',
                  currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'
                ]"
                @click="currentStep >= 2 ? goToProcessStep() : null"
              >
                <span 
                  :class="[
                    'text-sm font-medium',
                    currentStep >= 3 ? 'text-white' : 'text-gray-500'
                  ]"
                >
                  3
                </span>
              </div>
              <span class="absolute top-10 left-0 text-xs font-medium text-gray-900">Process</span>
            </li>
          </ol>
        </nav>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Upload Section -->
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Step 1: Upload File
            </h2>
            
            <ImageUploader
              ref="uploaderRef"
              @file-uploaded="handleFileUploaded"
              @upload-error="handleUploadError"
            />
            
            <div v-if="uploadedFile" class="mt-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex">
                  <CheckCircleIcon class="h-5 w-5 text-green-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">File Uploaded</h3>
                    <p class="text-sm text-green-700 mt-1">
                      {{ uploadedFile.originalName }}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                @click="goToConfigureStep"
                class="btn-primary w-full mt-4"
                style="background-color: #2563eb; color: white; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
              >
                <ArrowRightIcon class="h-5 w-5 mr-2" />
                Continue to Configure
              </button>
            </div>
          </div>
          
          <!-- Configure Section -->
          <div v-if="currentStep >= 2" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Step 2: Configure AI Instructions
            </h2>
            
            <InstructionPanel v-model="customInstructions" />
            
            <div class="mt-6 flex space-x-3">
              <button
                @click="goBackToUpload"
                class="btn-secondary flex-1"
                style="background-color: white; color: #374151; padding: 12px 16px; border-radius: 8px; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"
              >
                <ArrowLeftIcon class="h-5 w-5 mr-2" />
                Back to Upload
              </button>
              <button
                @click="goToProcessStep"
                class="btn-primary flex-1"
                style="background-color: #2563eb; color: white; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"
              >
                <ArrowRightIcon class="h-5 w-5 mr-2" />
                Continue to Process
              </button>
            </div>
          </div>
        </div>
        
        <!-- Processing Section -->
        <div class="space-y-6">
          <div v-if="currentStep >= 3" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Step 3: Process with AI
            </h2>
            
            <div v-if="currentStep < 3" class="text-center py-8">
              <CloudArrowUpIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-500">Complete previous steps to continue</p>
            </div>
            
            <div v-else-if="!isProcessing && !extractedData" class="space-y-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex">
                  <CheckCircleIcon class="h-5 w-5 text-green-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">File Ready</h3>
                    <p class="text-sm text-green-700 mt-1">
                      {{ uploadedFile.originalName }} uploaded successfully
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="flex space-x-3">
                <button
                  @click="goBackToConfigure"
                  class="btn-secondary flex-1"
                  style="background-color: white; color: #374151; padding: 12px 16px; border-radius: 8px; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"
                >
                  <ArrowLeftIcon class="h-5 w-5 mr-2" />
                  Back to Configure
                </button>
                <button
                  @click="processWithAI"
                  class="btn-primary flex-1"
                  style="background-color: #2563eb; color: white; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"
                >
                  <CpuChipIcon class="h-5 w-5 mr-2" />
                  Extract Payment Data
                </button>
              </div>
            </div>
            
            <div v-else-if="isProcessing" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p class="text-gray-600">AI is analyzing your document...</p>
              <p class="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
            
            <div v-else-if="extractedData" class="space-y-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex">
                  <CheckCircleIcon class="h-5 w-5 text-blue-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">Extraction Complete</h3>
                    <p class="text-sm text-blue-700 mt-1">
                      Found {{ (extractedData as any)?.extractedData?.length || 0 }} payment records
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                @click="proceedToReview"
                class="btn-primary w-full"
                style="background-color: #2563eb; color: white; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;"
              >
                <ArrowRightIcon class="h-5 w-5 mr-2" />
                Review & Edit Data
              </button>
              
              <button
                @click="startOver"
                class="btn-secondary w-full"
                style="background-color: white; color: #374151; padding: 12px 16px; border-radius: 8px; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center;"
              >
                Start Over
              </button>
            </div>
          </div>
          
          <!-- Processing Error -->
          <div v-if="processingError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Processing Error</h3>
                <p class="text-sm text-red-700 mt-1">{{ processingError }}</p>
              </div>
              <button
                @click="processingError = null"
                class="ml-auto text-red-400 hover:text-red-600"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { processApi } from '@/services/api'
import AuthGuard from '@/components/AuthGuard.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import InstructionPanel from '@/components/InstructionPanel.vue'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const toast = useToast()

// State
const uploaderRef = ref()
const uploadedFile = ref<any>(null)
const customInstructions = ref('')
const isProcessing = ref(false)
const extractedData = ref<any>(null)
const processingError = ref<string | null>(null)
const currentStep = ref(1)

// Computed
const canProcess = computed(() => !!uploadedFile.value && !isProcessing.value)

// Step Navigation Methods
const goToUploadStep = () => {
  currentStep.value = 1
}

const goToConfigureStep = () => {
  if (uploadedFile.value) {
    currentStep.value = 2
  }
}

const goToProcessStep = () => {
  if (uploadedFile.value) {
    currentStep.value = 3
  }
}

const goBackToUpload = () => {
  currentStep.value = 1
}

const goBackToConfigure = () => {
  currentStep.value = 2
}

// File Upload Methods
const handleFileUploaded = (file: any) => {
  uploadedFile.value = file
  extractedData.value = null
  processingError.value = null
  currentStep.value = 2 // Automatically move to configure step
  toast.success('File uploaded successfully!')
}

const handleUploadError = (error: string) => {
  toast.error(`Upload failed: ${error}`)
}

const processWithAI = async () => {
  if (!uploadedFile.value) return
  
  isProcessing.value = true
  processingError.value = null
  
  try {
    const response = await processApi.extractPaymentData(
      uploadedFile.value.base64Data,
      customInstructions.value
    )
    
    if (response.success && response.data) {
      extractedData.value = response.data
      const dataLength = (response.data as any)?.extractedData?.length || 0
      toast.success(`Extracted ${dataLength} payment records`)
    } else {
      throw new Error(response.error?.message || 'Processing failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Processing failed'
    processingError.value = errorMessage
    toast.error(`Processing failed: ${errorMessage}`)
  } finally {
    isProcessing.value = false
  }
}

const proceedToReview = () => {
  if (extractedData.value) {
    // Store data in session storage for the next page
    sessionStorage.setItem('extractedData', JSON.stringify(extractedData.value))
    sessionStorage.setItem('uploadedFile', JSON.stringify(uploadedFile.value))
    
    router.push('/process')
  }
}

const startOver = () => {
  uploadedFile.value = null
  extractedData.value = null
  processingError.value = null
  customInstructions.value = ''
  currentStep.value = 1
  uploaderRef.value?.removeFile()
}
</script>