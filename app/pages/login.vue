<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <AuthForm
        ref="authFormRef"
        title="Sign in to your account"
        description="Welcome back! Please sign in to continue."
        @submit="handleSignIn"
        @forgot-password="handleForgotPassword"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signIn } = useAuth()
const authFormRef = ref()

const handleSignIn = async (credentials: { email: string; password: string }) => {
  if (!authFormRef.value) return
  
  try {
    authFormRef.value.setLoading(true)
    authFormRef.value.setError(null)
    
    const result = await signIn.email({
      email: credentials.email,
      password: credentials.password
    })
    
    if (result.error) {
      authFormRef.value.setError(result.error.message || 'Invalid email or password')
      return
    }
    
    // Success - redirect will be handled by auth middleware
    await navigateTo('/')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    authFormRef.value.setError(message)
  } finally {
    authFormRef.value.setLoading(false)
  }
}

const handleForgotPassword = () => {
  // Navigate to forgot password page or show modal
  console.log('Forgot password clicked')
  // You can implement this based on your auth flow
  // Example: await navigateTo('/forgot-password')
}
</script>