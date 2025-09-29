<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Registration Success Message -->
      <div v-if="registrationSuccess" class="text-center space-y-6">
        <UIcon name="i-heroicons-envelope" class="h-16 w-16 mx-auto text-primary-600" />
        <div>
          <h2 class="text-3xl font-bold">{{ t('registration.successTitle') }}</h2>
          <p class="mt-2 text-sm text-gray-600">
            {{ t('registration.activationEmailSent') }}
          </p>
        </div>
        <div class="space-y-4">
          <p class="text-sm">
            {{ t('registration.checkEmailActivation') }}
          </p>
          <div class="text-center">
            <NuxtLink to="/login" class="text-sm text-primary-600 hover:text-primary-500">
              {{ t('auth.backToLogin') }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Registration Form -->
      <div v-else>
        <RegistrationForm
          :title="t('registration.title')"
          :description="t('registration.description')"
          @submit="handleRegistration"
        />

        <div class="text-center mt-8">
          <p class="text-sm text-gray-600">
            {{ t('registration.haveAccount') }}
            <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
              {{ t('auth.signIn') }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RegistrationFormData } from '../../types/registration'

definePageMeta({
  auth: false,
  layout: false
})

const { t } = useI18n()
const { signUp } = useAuth()

const registrationSuccess = ref(false)

// SEO meta
useSeoMeta({
  title: t('meta.register.title'),
  description: t('meta.register.description'),
  robots: 'noindex, nofollow'
})

const handleRegistration = async (data: RegistrationFormData) => {
  try {
    // Use Better Auth client for registration
    const result = await signUp.email({
      email: data.email,
      password: data.password,
      name: `${data.firstName} ${data.lastName}`,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    // For now, we'll handle organization membership creation via a separate API call
    await $fetch('/api/auth/register-membership', {
      method: 'POST',
      body: {
        userId: result.data!.user.id,
        congregationId: data.congregationId,
      }
    })

    // Show success message instead of redirecting
    registrationSuccess.value = true
  } catch (error) {
    console.error('Registration failed:', error)
    // Error handling should be done by the RegistrationForm component
  }
}
</script>
