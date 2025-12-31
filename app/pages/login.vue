<template>
  <div>
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="relative max-w-md w-full space-y-8">
        <div :class="{ 'pointer-events-none opacity-50': sessionFetching }">
          <AuthForm
            ref="authFormRef"
            :title="$t('auth.signInToAccount')"
            :description="`${$t('auth.welcomeBack')} ${$t('auth.signInToContinue')}`"
            @submit="handleSignIn"
            @forgot-password="handleForgotPassword" />
        </div>
      </div>
    </div>
    <!-- Loading overlay -->
    <div
      v-if="sessionFetching || overlayInitialState || loggedIn"
      class="absolute inset-0 flex items-center justify-center bg-black/50! w-full h-full">
      <UIcon
        name="i-heroicons-arrow-path"
        class="size-8 animate-spin text-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: false,
    auth: {
      only: "guest",
      // redirectUserTo: "/",
    },
  })

  const { signIn, fetchSession, sessionFetching, loggedIn } = useAuth()
  const authFormRef = ref()
  const overlayInitialState = useState("overlayInitialState", () => true)
  onMounted(() => {
    nextTick(() => {
      overlayInitialState.value = false
    })
  })

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    if (!authFormRef.value) return

    try {
      authFormRef.value.setLoading(true)
      authFormRef.value.setError(null)

      const result = await signIn.email({
        email: credentials.email,
        password: credentials.password,
      })
      await fetchSession()

      if (result.error) {
        authFormRef.value.setError(result.error.message || "Invalid email or password")
        return
      }

      // Success - redirect will be handled by auth middleware
      await nextTick()
      await navigateTo("/")
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      authFormRef.value.setError(message)
    } finally {
      authFormRef.value.setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // Navigate to forgot password page or show modal
    console.log("Forgot password clicked")
    // You can implement this based on your auth flow
    // Example: await navigateTo('/forgot-password')
  }
</script>
