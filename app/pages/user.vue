<template>
  <div class="space-y-6">
    <div class="border-dashed border-2 rounded-lg p-12 flex items-center justify-center min-h-96">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-default">
          {{ t("dashboard.welcomeUser", { email: user?.email }) }}
        </h1>
        <p class="mt-4 text-lg text-muted">
          {{ t("dashboard.userDashboard") }}
        </p>
      </div>
    </div>

    <!-- Passkey Setup Prompt -->
    <PasskeyPrompt
      ref="passkeyPromptRef"
      :auto-show="true" />
  </div>
</template>

<script setup lang="ts">
  // Page meta configuration for auth middleware
  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
  })

  const { t } = useI18n()
  const { user, client } = useAuth()

  const passkeyPromptRef = ref()

  await useState("user-has-passkeys", async () => {
    if (!user.value) return false

    try {
      const passkeys = await client.passkey.listUserPasskeys()
      return Array.isArray(passkeys) && passkeys.length > 0
    } catch (error) {
      console.warn("Server-side passkey check failed:", error)
      return null
    }
  })

  useSeoMeta({
    title: t("meta.dashboard.title"),
    description: t("meta.dashboard.description"),
    ogTitle: t("meta.dashboard.title"),
    ogDescription: t("meta.dashboard.description"),
    robots: "noindex, nofollow",
  })
</script>
