<script setup lang="ts">
  import type { WeekendMeetingListItem } from "#shared/types/api-weekend-meetings"

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: false,
  })

  const { t } = useI18n()
  const route = useRoute()

  // Force light mode for print with automatic restoration
  const { forceColorMode, restoreColorMode } = usePreserveColorMode()
  forceColorMode("light")

  // Additional safety: Restore on navigation
  onBeforeRouteLeave(() => {
    restoreColorMode()
  })

  // Parse month parameter (format: YYYY-MM)
  const monthParam = route.params.month as string

  // Validate month format
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(monthParam)) {
    navigateTo("/meetings/list")
  }

  // Parse year and month from parameter
  const [year, monthNumber] = monthParam.split("-")
  const monthDate = dayjs(`${year}-${monthNumber}-01`, "YYYY-MM-DD")

  if (!monthDate.isValid()) {
    navigateTo("/meetings/list")
  }

  // Get full month name and year for display
  const monthName = monthDate.format("MMMM") // Polish locale: "styczeń"
  const yearDisplay = monthDate.format("YYYY")

  // Calculate date range for the month
  const startOfMonth = monthDate.startOf("month")
  const endOfMonth = monthDate.endOf("month")

  // Fetch meetings data for the month
  const {
    data: programs,
    pending,
    error,
  } = await useFetch<WeekendMeetingListItem[]>("/api/weekend-meetings", {
    query: {
      startDate: startOfMonth.unix(),
      endDate: endOfMonth.unix(),
    },
  })

  // Fetch meeting exceptions for the month
  const { data: exceptions } = await useFetch("/api/meeting-exceptions", {
    query: {
      startDate: startOfMonth.unix(),
      endDate: endOfMonth.unix(),
    },
  })

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

  // Unified timeline grouped by month (YYYY-MM format)
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

    // 4. Group by months (YYYY-MM format)
    const groups = new Map<string, TimelineItem[]>()
    timeline.forEach(item => {
      const date = item.type === "meeting" ? item.meeting.date : item.exception.date
      const monthKey = dayjs.unix(date).format("YYYY-MM")

      if (!groups.has(monthKey)) {
        groups.set(monthKey, [])
      }
      groups.get(monthKey)!.push(item)
    })

    return groups
  })

  // Sort order for parts
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

  // Types for display items
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

  // Prepare display items (same logic as list.vue)
  function prepareDisplayItems(parts: WeekendMeetingPart[]): DisplayItem[] {
    // Filter out closing_prayer parts
    const filteredParts = parts.filter(part => part.type !== "closing_prayer")
    const sortedParts = [...filteredParts].sort(
      (a, b) => getSortOrder(a.type) - getSortOrder(b.type)
    )
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

  // SEO Meta with dynamic month/year
  useSeoMeta({
    title: t("seo.meetings.print.title", { month: monthName, year: yearDisplay }),
    description: t("seo.meetings.print.description", { month: monthName, year: yearDisplay }),
    ogTitle: t("seo.meetings.print.ogTitle", { month: monthName, year: yearDisplay }),
    ogDescription: t("seo.meetings.print.ogDescription"),
  })
</script>

<template>
  <div class="print-page">
    <!-- Loading State -->
    <div
      v-if="pending"
      class="no-print space-y-4">
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-24 w-full" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      class="no-print"
      color="error"
      :title="t('common.error')"
      :description="error.message" />

    <!-- Print Content -->
    <div
      v-else-if="
        unifiedTimelineByMonth.get(monthParam) && unifiedTimelineByMonth.get(monthParam)!.length > 0
      "
      class="print-content">
      <!-- Print Header -->
      <header class="print-header mb-6">
        <h1 class="text-2xl font-bold text-center mb-2">
          {{ t("meetings.printTitle") }}
        </h1>
        <h2 class="text-xl font-semibold text-center capitalize">
          {{ monthName }} {{ yearDisplay }}
        </h2>
      </header>

      <!-- Timeline List -->
      <div class="meetings-list space-y-4">
        <article
          v-for="item in unifiedTimelineByMonth.get(monthParam)"
          :key="
            item.type === 'meeting'
              ? `meeting-${item.meeting.id}`
              : `exception-${item.exception.id}`
          "
          class="meeting-block">
          <!-- Exception Block -->
          <template v-if="item.type === 'exception'">
            <div class="meeting-header mb-2">
              <h3 class="text-base font-semibold">
                {{ dayjs.unix(item.exception.date).format("dddd, D MMMM YYYY") }}
              </h3>
            </div>
            <div class="exception-notice border-l-4 border-purple-500 pl-3">
              <p class="font-semibold">
                {{ t(`meetings.meetingExceptions.types.${item.exception.exceptionType}`) }}
              </p>
              <p
                v-if="item.exception.description"
                class="text-xs text-gray-600 mt-1">
                {{ item.exception.description }}
              </p>
            </div>
          </template>

          <!-- Meeting Block -->
          <template v-else>
            <div class="meeting-header flex items-center gap-2 mb-2">
              <h3 class="text-base font-semibold">
                {{ dayjs.unix(item.meeting.date).format("dddd, D MMMM YYYY") }}
              </h3>
              <span
                v-if="item.meeting.isCircuitOverseerVisit"
                class="co-badge">
                {{ t("meetings.circuitOverseerVisit") }}
              </span>
            </div>

            <!-- Meeting Parts -->
            <div class="meeting-parts space-y-2">
              <MeetingPartItem
                v-for="partItem in prepareDisplayItems(item.meeting.parts)"
                :key="
                  partItem.type === 'watchtower_with_reader'
                    ? partItem.watchtowerPart.id
                    : partItem.part.id
                "
                :item="partItem" />
            </div>
          </template>
        </article>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="no-print">
      <UAlert
        color="info"
        :title="t('meetings.noSchedules')">
        {{ t("meetings.noSchedulesDescription") }}
      </UAlert>
    </div>
  </div>
</template>

<style>
  @import "~/assets/css/print-meetings.css";
</style>
