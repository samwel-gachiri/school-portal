<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">
        AI Extraction Instructions
      </h3>
      <button
        @click="toggleExpanded"
        class="text-gray-400 hover:text-gray-600"
      >
        <ChevronDownIcon 
          :class="[
            'h-5 w-5 transition-transform duration-200',
            isExpanded ? 'rotate-180' : ''
          ]"
        />
      </button>
    </div>
    
    <div v-show="isExpanded" class="space-y-4">
      <!-- Default Instructions Display -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-900 mb-2">
          Default Instructions
        </h4>
        <div class="text-sm text-blue-800 space-y-1">
          <p>• Extract amount from the AMOUNT column</p>
          <p>• Extract transaction reference from TRANSACTION REFERENCE NO column</p>
          <p>• Extract student name and class from ACCOUNT NAME column</p>
          <p>• Parse names as: [FirstName] [Class] [LastName] (e.g., "Liam G.2 Mbugua")</p>
          <p>• Handle handwritten text carefully</p>
        </div>
      </div>
      
      <!-- Custom Instructions Input -->
      <div>
        <label for="customInstructions" class="block text-sm font-medium text-gray-700 mb-2">
          Additional Instructions (Optional)
        </label>
        <textarea
          id="customInstructions"
          v-model="localInstructions"
          rows="4"
          class="input-field resize-none"
          placeholder="Add specific instructions for this document type or format..."
          @input="handleInput"
        />
        <p class="mt-1 text-xs text-gray-500">
          Provide specific guidance for unusual formats, column layouts, or data patterns
        </p>
      </div>
      
      <!-- Preset Instructions -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Quick Presets
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="preset in instructionPresets"
            :key="preset.name"
            @click="applyPreset(preset)"
            class="text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
          >
            <div class="font-medium text-sm text-gray-900">{{ preset.name }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ preset.description }}</div>
          </button>
        </div>
      </div>
      
      <!-- Saved Instructions -->
      <div v-if="savedInstructions.length > 0">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Previously Used Instructions
        </label>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <button
            v-for="(saved, index) in savedInstructions"
            :key="index"
            @click="applySavedInstruction(saved)"
            class="w-full text-left p-2 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors duration-200"
          >
            {{ saved.substring(0, 100) }}{{ saved.length > 100 ? '...' : '' }}
          </button>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          v-if="localInstructions"
          @click="saveInstructions"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Save for Later
        </button>
        <div class="flex space-x-2">
          <button
            @click="clearInstructions"
            class="btn-secondary text-sm"
            style="background-color: white; color: #374151; padding: 8px 16px; border-radius: 6px; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; font-size: 14px;"
          >
            Clear
          </button>
          <button
            @click="resetToDefault"
            class="btn-secondary text-sm"
            style="background-color: white; color: #374151; padding: 8px 16px; border-radius: 6px; border: 1px solid #d1d5db; font-weight: 500; cursor: pointer; font-size: 14px;"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const isExpanded = ref(true) // Start expanded by default
const localInstructions = ref(props.modelValue)
const savedInstructions = ref<string[]>([])

// Instruction presets
const instructionPresets = [
  {
    name: 'Bank Statement - Standard',
    description: 'Standard bank statement format with clear columns',
    instructions: 'Focus on clearly defined columns. Account names follow standard format.'
  },
  {
    name: 'Bank Statement - Handwritten',
    description: 'Handwritten entries that may be unclear',
    instructions: 'Pay extra attention to handwritten text. Some characters may be unclear or ambiguous. Use context clues from surrounding text.'
  },
  {
    name: 'Mobile Banking Screenshot',
    description: 'Screenshot from mobile banking app',
    instructions: 'This is a mobile banking screenshot. Transaction details may be in a different layout than traditional statements.'
  },
  {
    name: 'Multiple Pages',
    description: 'Document contains multiple transactions',
    instructions: 'Extract all visible transactions from the image. Ensure no entries are missed.'
  }
]

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleInput = () => {
  emit('update:modelValue', localInstructions.value)
}

const applyPreset = (preset: typeof instructionPresets[0]) => {
  localInstructions.value = preset.instructions
  emit('update:modelValue', localInstructions.value)
}

const applySavedInstruction = (instruction: string) => {
  localInstructions.value = instruction
  emit('update:modelValue', localInstructions.value)
}

const saveInstructions = () => {
  if (localInstructions.value && !savedInstructions.value.includes(localInstructions.value)) {
    savedInstructions.value.unshift(localInstructions.value)
    
    // Keep only the last 5 saved instructions
    if (savedInstructions.value.length > 5) {
      savedInstructions.value = savedInstructions.value.slice(0, 5)
    }
    
    // Save to localStorage
    localStorage.setItem('ai_instructions_history', JSON.stringify(savedInstructions.value))
  }
}

const clearInstructions = () => {
  localInstructions.value = ''
  emit('update:modelValue', '')
}

const resetToDefault = () => {
  localInstructions.value = ''
  emit('update:modelValue', '')
}

const loadSavedInstructions = () => {
  try {
    const saved = localStorage.getItem('ai_instructions_history')
    if (saved) {
      savedInstructions.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading saved instructions:', error)
  }
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  localInstructions.value = newValue
})

// Lifecycle
onMounted(() => {
  loadSavedInstructions()
})
</script>