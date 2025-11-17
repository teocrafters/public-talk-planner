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

  // Force light mode for print (ignore user dark mode preference)
  const colorMode = useColorMode()
  colorMode.preference = "light"

  onUnmounted(() => {
    colorMode.preference = "system"
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

  // Filter meetings to ensure they're in the selected month
  const monthPrograms = computed(() => {
    if (!programs.value) return []

    return programs.value.filter(program => {
      const programMonth = dayjs.unix(program.date).format("YYYY-MM")
      return programMonth === monthParam
    })
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
      v-else-if="monthPrograms && monthPrograms.length > 0"
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

      <!-- Meetings List -->
      <div class="meetings-list space-y-4">
        <article
          v-for="program in monthPrograms"
          :key="program.id"
          class="meeting-block">
          <!-- Meeting Date -->
          <div class="meeting-header flex items-center gap-2 mb-2">
            <h3 class="text-base font-semibold">
              {{ dayjs.unix(program.date).format("dddd, D MMMM YYYY") }}
            </h3>
            <span
              v-if="program.isCircuitOverseerVisit"
              class="co-badge">
              {{ t("meetings.circuitOverseerVisit") }}
            </span>
          </div>

          <!-- Meeting Parts -->
          <div class="meeting-parts space-y-2">
            <MeetingPartItem
              v-for="item in prepareDisplayItems(program.parts)"
              :key="item.type === 'watchtower_with_reader' ? item.watchtowerPart.id : item.part.id"
              :item="item" />
          </div>
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
