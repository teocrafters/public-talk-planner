<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ t('common.welcome') }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ t('auth.signInToContinue') }}
        </p>
      </div>
      
      <AuthForm
        ref="authFormRef"
        :title="t('auth.signInToAccount')"
        :description="t('dashboard.accessDashboard')"
        @submit="handleSignIn"
        @forgot-password="handleForgotPassword"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta configuration for auth middleware
definePageMeta({
  auth: {
    only: 'guest',
    redirectUserTo: '/user'
  }
})



const { t } = useI18n()
const { signIn } = useAuth()
const authFormRef = ref()

// SEO meta with i18n
useSeoMeta({
  title: t('meta.signIn.title'),
  description: t('meta.signIn.description'),
  ogTitle: t('meta.signIn.title'),
  ogDescription: t('meta.signIn.description'),
  robots: 'noindex, nofollow' // Don't index auth pages
})

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
      authFormRef.value.setError(result.error.message || t('auth.invalidCredentials'))
      return
    }
    
    // Success - redirect to user dashboard
    // The auth middleware will handle the redirect automatically
    // but we can also programmatically navigate for better UX
    await navigateTo('/user')
  } catch (error) {
    console.error('Authentication error:', error)
    const message = error instanceof Error ? error.message : t('errors.unexpectedError')
    authFormRef.value.setError(message)
  } finally {
    authFormRef.value.setLoading(false)
  }
}

const handleForgotPassword = () => {
  // TODO: Implement forgot password flow
  // This could navigate to a forgot password page or show a modal
  console.log('Forgot password functionality not yet implemented')
  
  // For now, show a helpful message
  authFormRef.value?.setError(t('errors.contactSupport'))
}
</script>
