<template>
  <div
    v-if="show"
    class="fixed top-4 right-4 max-w-md z-50">
    <UCard class="shadow-lg">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ t("passkey.setupTitle") }}</h3>
          <UButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark-20-solid"
            @click="dismiss" />
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-muted">
          {{ t("passkey.setupDescription") }}
        </p>

        <p class="text-xs text-dimmed">
          {{ t("passkey.benefits") }}
        </p>

        <div class="flex space-x-2">
          <UButton
            size="sm"
            :loading="loading"
            @click="setupPasskey">
            {{ t("passkey.setupNow") }}
          </UButton>
          <UButton
            variant="outline"
            size="sm"
            @click="remindLater">
            {{ t("passkey.remindLater") }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { user, client } = useAuth()
  const { markPasskeySetup } = useWebAuthn()
  const toast = useToast()

  const show = ref(false)
  const loading = ref(false)
  const hasPasskeys = ref(false)

  // Check if WebAuthn is supported
  const isWebAuthnSupported = computed(() => {
    if (typeof window === "undefined") return false
    return !!(window.PublicKeyCredential && navigator.credentials?.create)
  })

  const fetchHasPasskeys = async (): Promise<boolean> => {
    if (!user.value) return false

    try {
      const passkeys = await client.passkey.listUserPasskeys()
      return Array.isArray(passkeys.data) && passkeys.data.length > 0
    } catch (error) {
      console.warn("Passkey check failed:", error)
      return false
    }
  }

  // Complete decision logic for showing prompt
  const shouldShowPrompt = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false

    // Check if permanently dismissed
    const dismissed = localStorage.getItem("passkey-prompt-dismissed")
    if (dismissed === "true") return false

    // Check remind later logic
    const remindLater = localStorage.getItem("passkey-remind-later")
    if (remindLater) {
      const reminderTime = parseInt(remindLater)
      const daysSinceReminder = (Date.now() - reminderTime) / (1000 * 60 * 60 * 24)
      // Show again after 7 days
      return daysSinceReminder > 7
    }

    return true
  }

  // Initialize visibility with comprehensive async logic
  onMounted(async () => {
    if (!isWebAuthnSupported.value) return

    hasPasskeys.value = await fetchHasPasskeys()
    if (!hasPasskeys.value) return

    try {
      const shouldShow = await shouldShowPrompt()
      if (shouldShow) {
        setTimeout(() => {
          show.value = true
        }, 100)
      }
    } catch (error) {
      console.warn("Failed to determine if passkey prompt should show:", error)
    }
  })

  const setupPasskey = async () => {
    if (!isWebAuthnSupported.value) {
      toast.add({
        title: t("common.error"),
        description: t("passkey.notSupported"),
        color: "error",
      })
      return
    }

    try {
      loading.value = true

      // Use Better Auth client to add passkey
      await client.passkey.addPasskey()

      show.value = false

      toast.add({
        title: t("common.success"),
        description: t("passkey.setupSuccess"),
        color: "success",
      })

      // Mark as completed (updates both localStorage and server-side state)
      markPasskeySetup()

      hasPasskeys.value = true
    } catch (error) {
      console.error("Passkey setup failed:", error)

      toast.add({
        title: t("common.error"),
        description: t("passkey.setupError"),
        color: "error",
      })
    } finally {
      loading.value = false
    }
  }

  const dismiss = () => {
    show.value = false
    localStorage.setItem("passkey-prompt-dismissed", "true")
  }

  const remindLater = () => {
    show.value = false
    localStorage.setItem("passkey-remind-later", Date.now().toString())
  }
</script>
