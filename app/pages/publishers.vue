<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-default">
          {{ t("publishers.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("publishers.totalPublishers", { count: publishers?.length || 0 }) }}
        </p>
      </div>
      <UButton
        v-if="canManagePublishers"
        data-testid="add-publisher-button"
        icon="i-heroicons-plus"
        size="md"
        class="w-full sm:w-auto"
        @click="handleAddPublisher">
        {{ t("publishers.actions.add") }}
      </UButton>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="searchQuery"
        data-testid="publisher-search-input"
        :placeholder="t('publishers.searchPlaceholder')"
        icon="i-heroicons-magnifying-glass"
        class="flex-1" />
    </div>

    <div class="flex flex-wrap gap-2">
      <UCheckbox
        v-model="filters.isElder"
        data-testid="filter-elder"
        :label="t('publishers.capabilities.elder')" />
      <UCheckbox
        v-model="filters.isMinisterialServant"
        data-testid="filter-ministerial-servant"
        :label="t('publishers.capabilities.ministerialServant')" />
      <UCheckbox
        v-model="filters.canChairWeekendMeeting"
        data-testid="filter-chairman"
        :label="t('publishers.capabilities.canChairWeekendMeeting')" />
      <UCheckbox
        v-model="filters.conductsWatchtowerStudy"
        data-testid="filter-watchtower"
        :label="t('publishers.capabilities.conductsWatchtowerStudy')" />
      <UCheckbox
        v-model="filters.isReader"
        data-testid="filter-reader"
        :label="t('publishers.capabilities.reader')" />
      <UCheckbox
        v-model="filters.offersPublicPrayer"
        data-testid="filter-prayer"
        :label="t('publishers.capabilities.offersPublicPrayer')" />
      <UCheckbox
        v-model="filters.deliversPublicTalks"
        data-testid="filter-public-talks"
        :label="t('publishers.capabilities.deliversPublicTalks')" />
    </div>

    <div
      v-if="pending"
      class="space-y-4">
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-32 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      :title="t('common.error')"
      :description="error.message" />

    <div
      v-else-if="filteredPublishers.length > 0"
      class="space-y-3">
      <UCard
        v-for="publisher in filteredPublishers"
        :key="publisher.id"
        data-testid="publisher-card"
        class="hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-medium text-default">
                {{ publisher.firstName }} {{ publisher.lastName }}
              </h3>
              <UBadge
                v-if="publisher.userId"
                color="success"
                variant="subtle"
                data-testid="linked-badge">
                {{ t("publishers.linkedToUser") }}
              </UBadge>
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <UBadge
                v-if="publisher.isElder"
                color="primary"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.elder") }}
              </UBadge>
              <UBadge
                v-if="publisher.isMinisterialServant"
                color="primary"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.ministerialServant") }}
              </UBadge>
              <UBadge
                v-if="publisher.canChairWeekendMeeting"
                color="info"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.canChairWeekendMeeting") }}
              </UBadge>
              <UBadge
                v-if="publisher.conductsWatchtowerStudy"
                color="info"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.conductsWatchtowerStudy") }}
              </UBadge>
              <UBadge
                v-if="publisher.backupWatchtowerConductor"
                color="info"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.backupWatchtowerConductor") }}
              </UBadge>
              <UBadge
                v-if="publisher.isReader"
                color="info"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.reader") }}
              </UBadge>
              <UBadge
                v-if="publisher.offersPublicPrayer"
                color="info"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.offersPublicPrayer") }}
              </UBadge>
              <UBadge
                v-if="publisher.deliversPublicTalks"
                color="success"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.deliversPublicTalks") }}
              </UBadge>
              <UBadge
                v-if="publisher.isCircuitOverseer"
                color="warning"
                variant="subtle"
                size="xs">
                {{ t("publishers.capabilities.circuitOverseer") }}
              </UBadge>
            </div>
          </div>

          <UDropdownMenu
            v-if="canManagePublishers"
            :items="getPublisherActions(publisher)">
            <UButton
              icon="i-heroicons-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              data-testid="publisher-actions-menu" />
          </UDropdownMenu>
        </div>
      </UCard>
    </div>

    <UAlert
      v-else
      data-testid="no-results-alert"
      color="info"
      :title="t('publishers.noResults')"
      icon="i-heroicons-information-circle" />

    <PublisherModal
      v-model:open="editModalOpen"
      :publisher="selectedPublisher"
      :mode="editMode"
      @saved="handlePublisherSaved" />

    <LinkUserModal
      v-model:open="linkUserModalOpen"
      :publisher="selectedPublisherForLink"
      @saved="handlePublisherSaved" />
  </div>
</template>

<script setup lang="ts">
  import type { DropdownMenuItem } from "@nuxt/ui"

  interface Publisher {
    id: string
    firstName: string
    lastName: string
    userId: string | null
    isElder: boolean
    isMinisterialServant: boolean
    isRegularPioneer: boolean
    canChairWeekendMeeting: boolean
    conductsWatchtowerStudy: boolean
    backupWatchtowerConductor: boolean
    isReader: boolean
    offersPublicPrayer: boolean
    deliversPublicTalks: boolean
    isCircuitOverseer: boolean
    createdAt: Date
    updatedAt: Date
  }

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
    middleware: ["publisher-manager"],
  })

  const { t } = useI18n()
  const { can, fetchPermissions } = usePermissions()

  const canManagePublishers = computed(
    () => can("publishers", "create").value || can("publishers", "update").value
  )

  const canLinkUsers = computed(() => can("publishers", "link_to_user").value)

  const searchQuery = ref("")
  const filters = reactive({
    isElder: false,
    isMinisterialServant: false,
    canChairWeekendMeeting: false,
    conductsWatchtowerStudy: false,
    isReader: false,
    offersPublicPrayer: false,
    deliversPublicTalks: false,
  })
  const editModalOpen = ref(false)
  const selectedPublisher = ref<Publisher | null>(null)
  const editMode = ref<"add" | "edit">("add")
  const linkUserModalOpen = ref(false)
  const selectedPublisherForLink = ref<Publisher | null>(null)

  const {
    data: publishers,
    pending,
    error,
    refresh,
  } = await useFetch<Publisher[]>("/api/publishers")

  const filteredPublishers = computed(() => {
    if (!publishers.value) return []

    let filtered = publishers.value

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        p => p.firstName.toLowerCase().includes(query) || p.lastName.toLowerCase().includes(query)
      )
    }

    // Apply capability filters
    if (filters.isElder) {
      filtered = filtered.filter(p => p.isElder)
    }
    if (filters.isMinisterialServant) {
      filtered = filtered.filter(p => p.isMinisterialServant)
    }
    if (filters.canChairWeekendMeeting) {
      filtered = filtered.filter(p => p.canChairWeekendMeeting)
    }
    if (filters.conductsWatchtowerStudy) {
      filtered = filtered.filter(p => p.conductsWatchtowerStudy)
    }
    if (filters.isReader) {
      filtered = filtered.filter(p => p.isReader)
    }
    if (filters.offersPublicPrayer) {
      filtered = filtered.filter(p => p.offersPublicPrayer)
    }
    if (filters.deliversPublicTalks) {
      filtered = filtered.filter(p => p.deliversPublicTalks)
    }

    return filtered
  })

  const getPublisherActions = (publisher: Publisher): DropdownMenuItem[] => {
    const actions: DropdownMenuItem[] = [
      {
        label: t("publishers.actions.edit"),
        icon: "i-heroicons-pencil",
        onSelect: () => handleEdit(publisher),
      },
    ]

    if (canLinkUsers.value) {
      actions.push({
        label: publisher.userId
          ? t("publishers.actions.unlinkUser")
          : t("publishers.actions.linkUser"),
        icon: publisher.userId ? "i-heroicons-link-slash" : "i-heroicons-link",
        onSelect: () => handleLinkUser(publisher),
      })
    }

    return actions
  }

  const handleAddPublisher = () => {
    selectedPublisher.value = null
    editMode.value = "add"
    editModalOpen.value = true
  }

  const handleEdit = (publisher: Publisher) => {
    selectedPublisher.value = publisher
    editMode.value = "edit"
    editModalOpen.value = true
  }

  const handleLinkUser = (publisher: Publisher) => {
    selectedPublisherForLink.value = publisher
    linkUserModalOpen.value = true
  }

  const handlePublisherSaved = async () => {
    await refresh()
    editModalOpen.value = false
  }

  await fetchPermissions()

  // SEO meta
  useSeoPage("publishers.list")
</script>
