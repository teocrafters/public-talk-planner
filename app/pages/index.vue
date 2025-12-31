<template>
  <div class="space-y-6">
    <div class="border-dashed border-2 rounded-lg p-12 flex items-center justify-center min-h-96">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-default">
          {{ t("dashboard.welcomeUser", { email: user?.name }) }}
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
      // redirectGuestTo: "/login",
    },
    layout: "authenticated",
  })

  const { t } = useI18n()
  const { user, client } = useAuth()

  const passkeyPromptRef = ref()
  const hasPasskeys = useState<boolean>("user-has-passkeys", () => false)

  onMounted(async () => {
    // Client-only: Check for passkeys after hydration
    if (!user.value) return

    try {
      const passkeys = await client.passkey.listUserPasskeys()
      hasPasskeys.value = Array.isArray(passkeys) && passkeys.length > 0
    } catch (error) {
      console.warn("Passkey check failed:", error)
      hasPasskeys.value = false
    }
  })

  useSeoPage("dashboard")
</script>
