<script setup lang="ts">
  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
  })

  const { t } = useI18n()
  const { can, fetchPermissions } = usePermissions()

  await fetchPermissions()

  const {
    data: programs,
    pending,
    error,
  } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: dayjs().subtract(6, "month").unix(),
      endDate: dayjs().add(6, "month").unix(),
    },
  })

  const canSchedulePublicTalks = can("weekend_meetings", "schedule_public_talks")
  const canScheduleRestParts = can("weekend_meetings", "schedule_rest")

  const groupedByMonth = computed(() => {
    if (!programs.value) return new Map()

    const groups = new Map<string, WeekendMeetingListItem[]>()

    programs.value.forEach(program => {
      const monthKey = dayjs.unix(program.date).format("MMMM YYYY")

      if (!groups.has(monthKey)) {
        groups.set(monthKey, [])
      }
      groups.get(monthKey)!.push(program)
    })

    return groups
  })

  const currentMonthKey = computed(() => {
    return dayjs().format("MMMM YYYY")
  })

  function isCurrentMonth(monthKey: string): boolean {
    return monthKey === currentMonthKey.value
  }

  // Convert month name (e.g., "styczeń 2025") to YYYY-MM format
  function getMonthParam(monthKey: string): string {
    // monthKey format: "MMMM YYYY" (e.g., "styczeń 2025")
    // Parse using dayjs with Polish locale
    const parsed = dayjs(monthKey, "MMMM YYYY", "pl")
    return parsed.format("YYYY-MM")
  }

  // Open print page in new tab
  function handlePrintMonth(monthKey: string): void {
    const monthParam = getMonthParam(monthKey)
    console.log(">>> monthParam: ", monthParam, "monthKey: ", monthKey)
    const printUrl = `/meetings/print/${monthParam}`
    window.open(printUrl, "_blank")
  }

  function getSortOrder(partType: string): number {
    const order: Record<string, number> = {
      chairman: 1,
      public_talk: 2,
      watchtower_study: 3,
      circuit_overseer_talk: 4,
      reader: 5,
      closing_prayer: 6,
    }
    return order[partType] || 999
  }

  type WeekendMeetingPart = WeekendMeetingListItem["parts"][number]

  type DisplayItem =
    | {
        type: "talk"
        part: WeekendMeetingPart
      }
    | {
        type: "watchtower_with_reader"
        watchtowerPart: WeekendMeetingPart
        readerPart?: WeekendMeetingPart
      }
    | {
        type: "single"
        part: WeekendMeetingPart
      }

  function prepareDisplayItems(parts: WeekendMeetingPart[]): DisplayItem[] {
    const sortedParts = [...parts].sort((a, b) => getSortOrder(a.type) - getSortOrder(b.type))
    const displayItems: DisplayItem[] = []

    for (const part of sortedParts) {
      if (part.type === "public_talk" || part.type === "circuit_overseer_talk") {
        displayItems.push({ type: "talk", part })
      } else if (part.type === "watchtower_study") {
        const readerPart = sortedParts.find(p => p.type === "reader")
        displayItems.push({
          type: "watchtower_with_reader",
          watchtowerPart: part,
          readerPart,
        })
      } else if (part.type === "reader") {
        // Skip - already handled with watchtower_study
        continue
      } else {
        displayItems.push({ type: "single", part })
      }
    }

    return displayItems
  }

  useSeoPage("meetings.list")
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          data-testid="meetings-title"
          class="text-3xl font-bold tracking-tight text-default">
          {{ t("meetings.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("meetings.description") }}
        </p>
      </div>
      <div class="flex flex-row gap-2 sm:flex-col">
        <UButton
          v-if="canSchedulePublicTalks"
          data-testid="manage-button"
          icon="i-heroicons-calendar"
          size="md"
          class="w-full sm:w-auto"
          @click="navigateTo('/meetings/manage-public-talks')">
          {{ t("meetings.managePublicTalksButton") }}
        </UButton>
        <UButton
          v-if="canScheduleRestParts"
          data-testid="rest-parts-manage-button"
          icon="i-heroicons-calendar"
          size="md"
          class="w-full sm:w-auto"
          @click="navigateTo('/meetings/plan-weekend')">
          {{ t("meetings.manageRestParts") }}
        </UButton>
      </div>
    </div>

    <div
      v-if="pending"
      class="space-y-4">
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-24 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      data-testid="error-message"
      color="error"
      :title="t('common.error')"
      :description="error.message" />

    <div
      v-else-if="!programs || programs.length === 0"
      data-testid="empty-state">
      <UAlert
        color="info"
        :title="t('meetings.noSchedules')"
        icon="i-heroicons-information-circle">
        {{ t("meetings.noSchedulesDescription") }}
      </UAlert>
    </div>

    <div
      v-else
      data-testid="meetings-list"
      class="space-y-6">
      <div
        v-for="[month, monthPrograms] in groupedByMonth"
        :key="month"
        class="space-y-0">
        <div
          :class="[
            'sticky top-0 z-20 flex items-center justify-between p-3 border-b transition-all duration-200',
            isCurrentMonth(month)
              ? 'text-highlighted bg-muted border-accented'
              : 'text-default bg-default border-default',
          ]">
          <h2 class="text-xl font-semibold">
            {{ month }}
          </h2>
          <UButton
            icon="i-heroicons-printer"
            variant="ghost"
            size="sm"
            :aria-label="t('meetings.printView')"
            @click="handlePrintMonth(month)">
            {{ t("meetings.printView") }}
          </UButton>
        </div>
        <div class="mt-3 space-y-3">
          <UCard
            v-for="program in monthPrograms"
            :key="program.id"
            :data-testid="`meeting-card-${program.id}`"
            class="hover:shadow-md transition-shadow">
            <div class="space-y-4">
              <!-- Date and CO Visit Badge -->
              <div class="flex items-center gap-2">
                <p
                  data-testid="meeting-date"
                  class="text-lg font-semibold text-default">
                  {{ dayjs.unix(program.date).format("dddd, D MMMM YYYY") }}
                </p>
                <UBadge
                  v-if="program.isCircuitOverseerVisit"
                  color="secondary"
                  variant="subtle"
                  size="sm">
                  {{ t("meetings.circuitOverseerVisit") }}
                </UBadge>
              </div>

              <!-- All Meeting Parts -->
              <div class="flex flex-col gap-3">
                <MeetingPartItem
                  v-for="item in prepareDisplayItems(program.parts)"
                  :key="
                    item.type === 'watchtower_with_reader' ? item.watchtowerPart.id : item.part.id
                  "
                  :item="item" />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
