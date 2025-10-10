<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-default">
          {{ t("publicTalks.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("publicTalks.totalTalks", { count: talks?.length || 0 }) }}
        </p>
      </div>
      <UButton
        v-if="canEditTalks"
        data-testid="add-talk-button"
        icon="i-heroicons-plus"
        size="md"
        class="w-full sm:w-auto"
        @click="handleAddTalk">
        {{ t("publicTalks.actions.add") }}
      </UButton>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="searchQuery"
        data-testid="search-input"
        :placeholder="t('publicTalks.searchPlaceholder')"
        icon="i-heroicons-magnifying-glass"
        class="flex-1" />

      <USelect
        v-model="sortOrder"
        data-testid="sort-select"
        :items="sortOptions"
        value-key="value"
        class="w-full sm:w-48" />
    </div>

    <div
      v-if="pending"
      class="space-y-4">
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-24 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      :title="t('common.error')"
      :description="error.message" />

    <div
      v-else-if="filteredTalks.length > 0"
      class="space-y-3">
      <UCard
        v-for="talk in filteredTalks"
        :key="talk.id"
        data-testid="talk-card"
        class="hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-2">
              <span class="text-sm font-medium text-muted shrink-0">
                {{ talk.no }}
              </span>
              <TalkStatusBadge :status="talk.status" />
            </div>
            <h3 class="text-lg font-medium text-default break-words">
              {{ talk.title }}
            </h3>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="flex gap-2">
              <UBadge
                v-if="talk.multimediaCount > 0"
                color="info"
                variant="subtle"
                class="hidden sm:flex">
                <UIcon
                  name="i-heroicons-photo"
                  class="w-4 h-4" />
                {{ talk.multimediaCount }}
              </UBadge>

              <UBadge
                v-if="talk.videoCount > 0"
                color="secondary"
                variant="subtle"
                class="hidden sm:flex">
                <UIcon
                  name="i-heroicons-video-camera"
                  class="w-4 h-4" />
                {{ talk.videoCount }}
              </UBadge>
            </div>

            <TalkActionsMenu
              v-if="canMarkTalks"
              :key="talk.id"
              :talk="talk"
              :user-role="role"
              @status-changed="handleStatusChanged"
              @edit-requested="() => handleEditRequested(talk)"
              @confirm-requested="handleConfirmRequested" />
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-else
      data-testid="no-results-alert"
      color="info"
      :title="t('publicTalks.noResults')"
      icon="i-heroicons-information-circle" />

    <TalkEditModal
      v-model:open="editModalOpen"
      :talk="selectedTalk"
      :mode="editMode"
      @saved="handleTalkSaved" />

    <ConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :confirm-text="t('publicTalks.confirmations.confirm')"
      :cancel-text="t('publicTalks.confirmations.cancel')"
      variant="warning"
      @confirm="handleConfirm" />
  </div>
</template>

<script setup lang="ts">
  interface PublicTalk {
    id: number
    no: string
    title: string
    multimediaCount: number
    videoCount: number
    status: "circuit_overseer" | "will_be_replaced" | null
    createdAt: Date
  }

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
  })

  const { t } = useI18n()

  const { data: talks, pending, error, refresh } = await useFetch<PublicTalk[]>("/api/public-talks")

  const { role, canMarkTalks, canEditTalks, fetchPermissions } = usePermissions()

  const searchQuery = ref("")
  const sortOrder = ref<"asc" | "desc">("asc")
  const editModalOpen = ref(false)
  const editMode = ref<"add" | "edit">("add")
  const selectedTalk = ref<PublicTalk | null>(null)

  const showConfirmDialog = ref(false)
  const confirmDialogConfig = ref({
    title: "",
    message: "",
    action: "",
    talkId: 0,
  })

  const sortOptions = computed(() => [
    { value: "asc", label: t("publicTalks.sortAscending") },
    { value: "desc", label: t("publicTalks.sortDescending") },
  ])

  const filteredTalks = computed(() => {
    if (!talks.value) return []

    let result = [...talks.value]

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        talk => talk.no.toString().includes(query) || talk.title.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      const aNum = parseInt(a.no)
      const bNum = parseInt(b.no)
      return sortOrder.value === "asc" ? aNum - bNum : bNum - aNum
    })

    return result
  })

  const handleStatusChanged = (updatedTalk: PublicTalk) => {
    if (!talks.value) return

    const index = talks.value.findIndex(talk => talk.id === updatedTalk.id)
    if (index !== -1) {
      const updatedTalks = [...talks.value]
      updatedTalks[index] = updatedTalk
      talks.value = updatedTalks
    }
  }

  const handleEditRequested = (talk: PublicTalk) => {
    selectedTalk.value = talk
    editMode.value = "edit"
    editModalOpen.value = true
  }

  const handleAddTalk = () => {
    selectedTalk.value = null
    editMode.value = "add"
    editModalOpen.value = true
  }

  const handleTalkSaved = async (savedTalk: PublicTalk) => {
    if (editMode.value === "add") {
      await refresh()
    } else if (talks.value) {
      const index = talks.value.findIndex(talk => talk.id === savedTalk.id)
      if (index !== -1) {
        talks.value[index] = savedTalk
      }
    }
  }

  const handleConfirmRequested = (config: {
    title: string
    message: string
    action: string
    talkId: number
  }) => {
    confirmDialogConfig.value = config
    showConfirmDialog.value = true
  }

  const handleConfirm = async () => {
    const { talkId, action } = confirmDialogConfig.value
    let newStatus: "circuit_overseer" | "will_be_replaced" | null = null

    if (action === "block") {
      newStatus = "circuit_overseer"
    } else if (action === "replace") {
      newStatus = "will_be_replaced"
    }

    try {
      const response = await $fetch<{ success: boolean; talk: PublicTalk }>(
        `/api/public-talks/${talkId}/status`,
        {
          method: "PATCH",
          body: { status: newStatus },
        }
      )

      if (response.success && response.talk) {
        handleStatusChanged(response.talk)
        useToast().add({
          title: t("publicTalks.messages.statusUpdated"),
          color: "success",
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

      useToast().add({
        title: t("errors.error"),
        description: errorMessage,
        color: "error",
      })
    } finally {
      showConfirmDialog.value = false
    }
  }

  onMounted(async () => {
    await fetchPermissions()
  })

  useSeoMeta({
    title: t("meta.publicTalks.title"),
    description: t("meta.publicTalks.description"),
    ogTitle: t("meta.publicTalks.title"),
    ogDescription: t("meta.publicTalks.description"),
    robots: "noindex, nofollow",
  })
</script>
