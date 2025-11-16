<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <UIcon
          name="i-heroicons-envelope"
          class="h-16 w-16 mx-auto text-primary-600" />
        <h2 class="mt-6 text-3xl font-bold">{{ t("auth.emailVerification") }}</h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ t("registration.verificationSent") }}
        </p>
      </div>

      <div class="space-y-4">
        <p class="text-sm">
          {{ t("registration.checkEmail") }}
        </p>

        <UButton
          variant="outline"
          :loading="resending"
          @click="resendEmail">
          {{ resending ? t("common.sending") : t("auth.resendEmail") }}
        </UButton>

        <div class="text-center">
          <NuxtLink
            to="/login"
            class="text-sm text-primary-600 hover:text-primary-500">
            {{ t("auth.backToLogin") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    auth: {
      only: "guest",
    },
    layout: false,
  })

  const { t } = useI18n()
  const resending = ref(false)

  // SEO meta
  useSeoPage("auth.verifyEmail")

  const resendEmail = async () => {
    try {
      resending.value = true

      // For now, we'll implement this as a placeholder
      // In a real implementation, we would need the user's email
      // which could come from query params or session
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Show success message
      // This should be handled with proper toast notifications
      console.log("Verification email sent")
    } catch (error) {
      console.error("Failed to resend verification email:", error)
    } finally {
      resending.value = false
    }
  }
</script>
