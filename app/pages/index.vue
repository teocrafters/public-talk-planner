<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ t("common.welcome") }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ t("auth.signInToContinue") }}
        </p>
      </div>

      <AuthForm
        ref="authFormRef"
        :title="t('auth.signInToAccount')"
        :description="t('dashboard.accessDashboard')"
        @submit="handleSignIn"
        @forgot-password="handleForgotPassword"
        @passkey-success="handlePasskeySuccess" />

      <div class="text-center">
        <p class="text-sm text-gray-600">
          {{ t("registration.noAccount") }}
          <NuxtLink
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500">
            {{ t("auth.register") }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Page meta configuration for auth middleware
  definePageMeta({
    auth: {
      only: "guest",
      redirectUserTo: "/user",
    },
  })

  const { t } = useI18n()
  const { signIn } = useAuth()
  const route = useRoute()

  const authFormRef = ref()

  const redirectUrl = computed(() => {
    const redirect = route.query.redirect as string | undefined
    // Validate: must be internal path
    return redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/user"
  })

  // SEO meta with i18n
  useSeoPage("auth.signIn")

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    if (!authFormRef.value) return

    try {
      authFormRef.value.setLoading(true)
      authFormRef.value.setError(null)

      const result = await signIn.email({
        email: credentials.email,
        password: credentials.password,
      })

      if (result.error) {
        authFormRef.value.setError(result.error.message || t("auth.invalidCredentials"))
        return
      }

      // Success - redirect to original URL or user dashboard
      await navigateTo(redirectUrl.value)
    } catch (error) {
      console.error("Authentication error:", error)
      const message = error instanceof Error ? error.message : t("errors.unexpectedError")
      authFormRef.value.setError(message)
    } finally {
      authFormRef.value.setLoading(false)
    }
  }

  const handlePasskeySuccess = async () => {
    // Passkey login successful - redirect to original URL or user dashboard
    await navigateTo(redirectUrl.value)
  }

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    // This could navigate to a forgot password page or show a modal
    console.log("Forgot password functionality not yet implemented")

    // For now, show a helpful message
    authFormRef.value?.setError(t("errors.contactSupport"))
  }
</script>
