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
      startDate: dayjs().startOf("month").unix(),
    },
  })

  const { data: exceptions, refresh: refreshExceptions } = await useFetch(
    "/api/meeting-exceptions",
    {
      query: {
        startDate: dayjs().startOf("month").unix(),
      },
    }
  )

  // Refresh exceptions when page becomes visible (e.g., after navigating back)
  onMounted(() => {
    refreshExceptions()
  })

  const canSchedulePublicTalks = can("weekend_meetings", "schedule_public_talks")
  const canScheduleRestParts = can("weekend_meetings", "schedule_rest")

  // Unified timeline item type
  type TimelineItem =
    | {
        type: "meeting"
        meeting: WeekendMeetingListItem
      }
    | {
        type: "exception"
        exception: NonNullable<typeof exceptions.value>[number]
      }

  // Unified timeline grouped by month (MMMM YYYY format)
  const unifiedTimelineByMonth = computed(() => {
    if (!programs.value && !exceptions.value) return new Map()

    const timeline: TimelineItem[] = []
    const exceptionDates = new Set<string>() // format: "YYYY-MM-DD"

    // 1. Add all exceptions to timeline and remember dates
    exceptions.value?.forEach(exception => {
      timeline.push({ type: "exception", exception })
      exceptionDates.add(dayjs.unix(exception.date).format("YYYY-MM-DD"))
    })

    // 2. Add programs ONLY if there's NO exception on that day
    programs.value?.forEach(program => {
      const programDate = dayjs.unix(program.date).format("YYYY-MM-DD")
      if (!exceptionDates.has(programDate)) {
        timeline.push({ type: "meeting", meeting: program })
      }
    })

    // 3. Sort chronologically
    timeline.sort((a, b) => {
      const dateA = a.type === "meeting" ? a.meeting.date : a.exception.date
      const dateB = b.type === "meeting" ? b.meeting.date : b.exception.date
      return dateA - dateB
    })

    // 4. Group by months (MMMM YYYY)
    const groups = new Map<string, TimelineItem[]>()
    timeline.forEach(item => {
      const date = item.type === "meeting" ? item.meeting.date : item.exception.date
      const monthKey = dayjs.unix(date).format("MMMM YYYY")

      if (!groups.has(monthKey)) {
        groups.set(monthKey, [])
      }
      groups.get(monthKey)!.push(item)
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
        v-for="[month, monthItems] in unifiedTimelineByMonth"
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
          <template
            v-for="item in monthItems"
            :key="
              item.type === 'meeting'
                ? `meeting-${item.meeting.id}`
                : `exception-${item.exception.id}`
            ">
            <!-- Exception Card -->
            <UCard
              v-if="item.type === 'exception'"
              color="purple"
              variant="subtle"
              :data-testid="`exception-card-${item.exception.date}`">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="text-purple-500" />
                <div>
                  <p class="text-sm text-muted">
                    {{ formatDatePL(item.exception.date) }}
                  </p>
                  <p class="font-semibold text-default">
                    {{ t(`meetings.meetingExceptions.types.${item.exception.exceptionType}`) }}
                  </p>
                  <p
                    v-if="item.exception.description"
                    class="text-sm text-muted">
                    {{ item.exception.description }}
                  </p>
                </div>
              </div>
            </UCard>

            <!-- Meeting Card -->
            <UCard
              v-else
              :data-testid="`meeting-card-${item.meeting.id}`"
              class="hover:shadow-md transition-shadow">
              <div class="space-y-4">
                <!-- Date and CO Visit Badge -->
                <div class="flex items-center gap-2">
                  <p
                    data-testid="meeting-date"
                    class="text-lg font-semibold text-default">
                    {{ dayjs.unix(item.meeting.date).format("dddd, D MMMM YYYY") }}
                  </p>
                  <UBadge
                    v-if="item.meeting.isCircuitOverseerVisit"
                    color="secondary"
                    variant="subtle"
                    size="sm">
                    {{ t("meetings.circuitOverseerVisit") }}
                  </UBadge>
                </div>

                <!-- All Meeting Parts -->
                <div class="flex flex-col gap-3">
                  <MeetingPartItem
                    v-for="partItem in prepareDisplayItems(item.meeting.parts)"
                    :key="
                      partItem.type === 'watchtower_with_reader'
                        ? partItem.watchtowerPart.id
                        : partItem.part.id
                    "
                    :item="partItem" />
                </div>
              </div>
            </UCard>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
