<script setup lang="ts">
  interface PublicTalk {
    id: number
    no: string
    title: string
    multimediaCount: number
    videoCount: number
    status: "circuit_overseer" | "will_be_replaced" | null
    createdAt: Date
    lastGivenDate: number | null
  }

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
    middleware: ["talks-manager"],
  })

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const { can, fetchPermissions } = usePermissions()

  const canUpdateTalks = can("talks", "update")
  const canFlagTalks = can("talks", "flag")

  const searchQuery = ref("")
  const sortBy = ref((route.query.sortBy as string) || "lastGiven")
  const sortOrder = ref<"asc" | "desc">((route.query.sortOrder as "asc" | "desc") || "asc")

  const {
    data: talks,
    pending,
    error,
    refresh,
  } = await useFetch<PublicTalk[]>("/api/public-talks", {
    query: {
      sortBy,
      sortOrder,
    },
  })
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
    { value: "number-asc", label: t("publicTalks.sortByNumberAsc") },
    { value: "number-desc", label: t("publicTalks.sortByNumberDesc") },
    { value: "title-asc", label: t("publicTalks.sortByTitleAsc") },
    { value: "title-desc", label: t("publicTalks.sortByTitleDesc") },
    { value: "lastGiven-asc", label: t("publicTalks.sortByLastGivenAsc") },
    { value: "lastGiven-desc", label: t("publicTalks.sortByLastGivenDesc") },
  ])

  const selectedSortOption = computed(() => `${sortBy.value}-${sortOrder.value}`)

  function handleSortChange(newValue: string) {
    const [newSortBy, newSortOrder] = newValue.split("-")
    if (newSortBy && newSortOrder) {
      sortBy.value = newSortBy
      sortOrder.value = newSortOrder as "asc" | "desc"

      // Update URL query parameters
      router.push({
        query: {
          ...route.query,
          sortBy: newSortBy,
          sortOrder: newSortOrder,
        },
      })
    }
  }

  const filteredTalks = computed(() => {
    if (!talks.value) return []

    let result = [...talks.value]

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        talk => talk.no.toString().includes(query) || talk.title.toLowerCase().includes(query)
      )
    }

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

  await fetchPermissions()

  useSeoPage("talks.list")
</script>

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
        v-if="canUpdateTalks"
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
        v-model="selectedSortOption"
        data-testid="sort-select"
        :items="sortOptions"
        value-key="value"
        class="w-full sm:w-56"
        @update:model-value="handleSortChange" />
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
      <ClientOnly>
        <UCard
          v-for="talk in filteredTalks"
          :key="talk.id"
          data-testid="talk-card"
          class="hover:shadow-md transition-shadow">
          <div class="space-y-3">
            <!-- First Row: Talk Number and Title -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UBadge
                  data-testid="talk-number-chip"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  class="shrink-0">
                  {{ talk.no }}
                </UBadge>
                <h3 class="text-lg font-medium text-default break-words">
                  {{ talk.title }}
                </h3>
              </div>

              <TalkActionsMenu
                v-if="canFlagTalks || canUpdateTalks"
                :key="talk.id"
                :talk="talk"
                :can-flag="canFlagTalks"
                :can-update="canUpdateTalks"
                @status-changed="handleStatusChanged"
                @edit-requested="() => handleEditRequested(talk)"
                @confirm-requested="handleConfirmRequested" />
            </div>

            <!-- Second Row: Metadata -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Last given date -->
              <UBadge
                data-testid="talk-last-given-date"
                :color="talk.lastGivenDate ? 'success' : 'error'"
                variant="subtle"
                size="xs">
                <UIcon
                  name="i-heroicons-calendar"
                  class="w-3.5 h-3.5 mr-1" />
                <span v-if="talk.lastGivenDate">{{ formatDatePL(talk.lastGivenDate) }}</span>
                <span v-else>{{ t("speakers.never") }}</span>
              </UBadge>

              <!-- Multimedia count -->
              <UBadge
                v-if="talk.multimediaCount > 0"
                data-testid="talk-multimedia-count"
                color="info"
                variant="subtle"
                size="xs">
                <UIcon
                  name="i-heroicons-photo"
                  class="w-3.5 h-3.5 mr-1" />
                {{ talk.multimediaCount }}
              </UBadge>

              <!-- Video count -->
              <UBadge
                v-if="talk.videoCount > 0"
                data-testid="talk-video-count"
                color="secondary"
                variant="subtle"
                size="xs">
                <UIcon
                  name="i-heroicons-video-camera"
                  class="w-3.5 h-3.5 mr-1" />
                {{ talk.videoCount }}
              </UBadge>

              <!-- Status badge -->
              <TalkStatusBadge
                v-if="talk.status"
                :status="talk.status" />
            </div>
          </div>
        </UCard>
      </ClientOnly>
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
