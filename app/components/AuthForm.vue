<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Header -->
    <div v-if="title || description" class="text-center">
      <h2 v-if="title" class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ description }}
      </p>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <Icon name="i-heroicons-x-circle-20-solid" class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ t('auth.authenticationError') }}
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Form Fields -->
    <div class="space-y-4">
      <!-- Email Field -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('auth.emailAddress') }}
        </label>
        <div class="mt-1">
          <input
            id="email"
            v-model="formData.email"
            type="email"
            autocomplete="email"
            required
            :disabled="loading"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
            :placeholder="t('auth.enterEmail')"
          >
        </div>
      </div>

      <!-- Password Field -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('common.password') }}
        </label>
        <div class="mt-1 relative">
          <input
            id="password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :disabled="loading"
            class="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
            :placeholder="t('auth.enterPassword')"
          >
          <button
            type="button"
            :disabled="loading"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            @click="showPassword = !showPassword"
          >
            <Icon
              :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              class="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Forgot Password Link -->
    <div class="flex items-center justify-between">
      <div/>
      <div class="text-sm">
        <button
          type="button"
          class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="$emit('forgot-password')"
        >
          {{ t('auth.forgotPassword') }}
        </button>
      </div>
    </div>

    <!-- Submit Button -->
    <div>
      <button
        type="submit"
        :disabled="loading || !isFormValid"
        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
      >
        <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
          <Icon name="i-heroicons-arrow-path" class="h-5 w-5 text-primary-300 animate-spin" />
        </span>
        {{ loading ? t('auth.signingIn') : submitText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
interface AuthFormProps {
  title?: string
  description?: string
  submitText?: string
}

interface AuthFormEmits {
  submit: [credentials: { email: string; password: string }]
  'forgot-password': []
}

const props = defineProps<AuthFormProps>()
const { t } = useI18n()
const submitText = computed(() => props.submitText || t('auth.signIn'))

const emit = defineEmits<AuthFormEmits>()

// Form state
const formData = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

// Form validation
const isFormValid = computed(() => {
  return formData.email.length > 0 &&
         formData.password.length > 0 &&
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
})

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) return

  try {
    loading.value = true
    error.value = null

    emit('submit', {
      email: formData.email,
      password: formData.password
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.unexpectedError')
  } finally {
    loading.value = false
  }
}

// Clear error when form data changes
watch([() => formData.email, () => formData.password], () => {
  if (error.value) {
    error.value = null
  }
})

// Expose methods for parent component control
defineExpose({
  setLoading: (value: boolean) => { loading.value = value },
  setError: (message: string | null) => { error.value = message },
  clearForm: () => {
    formData.email = ''
    formData.password = ''
    error.value = null
  }
})
</script>
