<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {{ t('dashboard.welcomeUser', { email: user?.email }) }}
            </h1>
            <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
              {{ t('dashboard.userDashboard') }}
            </p>
            <div class="mt-6">
              <button
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                @click="handleSignOut"
              >
                {{ t('auth.signOut') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Passkey Setup Prompt -->
    <PasskeyPrompt ref="passkeyPromptRef" :auto-show="true" />
  </div>
</template>

<script setup lang="ts">
// Page meta configuration for auth middleware
definePageMeta({
  auth: {
    only: 'user',
    redirectGuestTo: '/'
  }
})

const { t } = useI18n()
const { user, signOut, client } = useAuth()

const passkeyPromptRef = ref()

// Server-side passkey check with useState for SSR (used by PasskeyPrompt component)
await useState('user-has-passkeys', async () => {
  // Only check if user is authenticated
  if (!user.value) return false
  
  try {
    const passkeys = await client.passkey.listUserPasskeys()
    return Array.isArray(passkeys) && passkeys.length > 0
  } catch (error) {
    console.warn('Server-side passkey check failed:', error)
    return null // null indicates we should fallback to client-side check
  }
})

// SEO meta for the user dashboard
useSeoMeta({
  title: t('meta.dashboard.title'),
  description: t('meta.dashboard.description'),
  ogTitle: t('meta.dashboard.title'),
  ogDescription: t('meta.dashboard.description'),
  robots: 'noindex, nofollow' // Don't index protected pages
})

const handleSignOut = async () => {
  try {
    await signOut({ redirectTo: '/' })
  } catch (error) {
    console.error('Sign out error:', error)
  }
}
</script>
