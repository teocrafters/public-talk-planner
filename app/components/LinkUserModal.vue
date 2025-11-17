<script setup lang="ts">
  interface Publisher {
    id: string
    firstName: string
    lastName: string
    userId: string | null
  }

  interface UnlinkedUser {
    id: string
    name: string
    email: string
  }

  interface Props {
    publisher: Publisher | null
  }

  const props = defineProps<Props>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const emit = defineEmits<{
    saved: []
  }>()

  const { t } = useI18n()
  const toast = useToast()

  const isSubmitting = ref(false)
  const selectedUserId = ref<string | undefined>(undefined)

  // Fetch unlinked users (SSR-compatible)
  const {
    data: unlinkedUsers,
    pending,
    error,
  } = await useFetch<UnlinkedUser[]>("/api/users/unlinked")

  // Computed properties
  const isUnlinkMode = computed(() => props.publisher?.userId !== null)

  const modalTitle = computed(() =>
    isUnlinkMode.value
      ? t("publishers.linkUserModal.unlinkTitle")
      : t("publishers.linkUserModal.linkTitle")
  )

  const submitButtonText = computed(() =>
    isUnlinkMode.value ? t("publishers.linkUserModal.unlink") : t("publishers.linkUserModal.link")
  )

  const userItems = computed(() => {
    if (!unlinkedUsers.value) return []

    return unlinkedUsers.value.map(u => ({
      label: `${u.name} (${u.email})`,
      value: u.id,
    }))
  })

  // Reset selected user when modal opens or mode changes
  watch(
    [isOpen, () => props.publisher],
    ([open, publisher]) => {
      if (open) {
        selectedUserId.value = publisher?.userId || undefined
      }
    },
    { immediate: true }
  )

  const onSubmit = async () => {
    if (!props.publisher?.id) return

    // In link mode, require user selection
    if (!isUnlinkMode.value && !selectedUserId.value) {
      toast.add({
        title: t("common.error"),
        description: t("validation.required"),
        color: "error",
      })
      return
    }

    isSubmitting.value = true

    try {
      await $fetch(`/api/publishers/${props.publisher.id}/link-user`, {
        method: "PATCH",
        body: {
          userId: isUnlinkMode.value ? null : selectedUserId.value || null,
        },
      })

      toast.add({
        title: isUnlinkMode.value
          ? t("publishers.messages.userUnlinked")
          : t("publishers.messages.userLinked"),
        color: "success",
      })

      emit("saved")
      isOpen.value = false
    } catch (error: unknown) {
      if (isApiValidationError(error)) {
        toast.add({
          title: t("common.error"),
          description: t(error.data.data.message),
          color: "error",
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")
        toast.add({
          title: t("common.error"),
          description: errorMessage,
          color: "error",
        })
      }
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    data-testid="link-user-modal"
    :ui="{ footer: 'justify-between' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ modalTitle }}</h3>
    </template>

    <template #body>
      <div
        v-if="pending"
        class="flex items-center justify-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="size-6 animate-spin text-primary" />
        <span class="ml-2 text-sm text-muted">{{
          t("publishers.linkUserModal.loadingUsers")
        }}</span>
      </div>

      <div
        v-else-if="error"
        class="py-4">
        <UAlert
          color="error"
          :title="t('common.error')"
          :description="error.message" />
      </div>

      <div
        v-else-if="isUnlinkMode"
        class="space-y-4">
        <p class="text-sm text-default">
          {{ t("publishers.linkUserModal.currentlyLinked") }}:
          <span class="font-medium">{{ publisher?.userId }}</span>
        </p>
        <UAlert
          color="warning"
          :title="t('publishers.linkUserModal.unlinkTitle')"
          icon="i-heroicons-exclamation-triangle" />
      </div>

      <div
        v-else-if="userItems.length === 0"
        class="py-4">
        <UAlert
          color="info"
          :title="t('publishers.linkUserModal.noUnlinkedUsers')"
          icon="i-heroicons-information-circle" />
      </div>

      <div
        v-else
        class="space-y-4">
        <UFormField
          name="userId"
          :label="t('publishers.linkUserModal.selectUser')"
          required>
          <USelectMenu
            v-model="selectedUserId"
            data-testid="link-user-select"
            :items="userItems"
            value-key="value"
            searchable
            :search-placeholder="t('publishers.linkUserModal.searchUsers')"
            class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        data-testid="link-user-cancel-button"
        color="neutral"
        variant="ghost"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        data-testid="link-user-submit-button"
        :color="isUnlinkMode ? 'error' : 'primary'"
        :loading="isSubmitting"
        :disabled="!isUnlinkMode && !selectedUserId"
        @click="onSubmit">
        {{ submitButtonText }}
      </UButton>
    </template>
  </UModal>
</template>
