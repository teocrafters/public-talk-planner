<script setup lang="ts">
  import type { DateValue } from "@internationalized/date"
  import type { YYYYMMDD } from "#shared/types/date"

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
    middleware: ["public-talks-manager"],
  })

  const { t } = useI18n()

  // Use composable for calendar chip logic
  const { shouldShowChip, getChipColor } = useCalendarChipColor()

  // Fetch schedules for calendar range (3 months)
  const { data: schedules, refresh } = await useFetch("/api/schedules", {
    query: {
      startDate: formatToYYYYMMDD(dayjs().subtract(1, "month").toDate()),
      endDate: formatToYYYYMMDD(dayjs().add(3, "month").toDate()),
    },
  })

  // Fetch weekend meetings for Circuit Overseer visit info
  const { data: weekendPrograms } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: formatToYYYYMMDD(dayjs().subtract(1, "month").toDate()),
      endDate: formatToYYYYMMDD(dayjs().add(3, "month").toDate()),
    },
  })

  // Fetch meeting exceptions for calendar chip display
  const { data: exceptions } = await useFetch("/api/meeting-exceptions", {
    query: {
      startDate: formatToYYYYMMDD(dayjs().subtract(1, "month").toDate()),
      endDate: formatToYYYYMMDD(dayjs().add(3, "month").toDate()),
    },
  })

  // Responsive months display - start with mobile size
  const windowWidth = ref(1)
  const numberOfMonths = computed(() => {
    if (windowWidth.value >= 1024) return 3
    if (windowWidth.value >= 640) return 2
    return 1
  })

  onMounted(() => {
    if (typeof window !== "undefined") {
      windowWidth.value = window.innerWidth
      window.addEventListener("resize", () => {
        windowWidth.value = window.innerWidth
      })
    }
  })

  // Calendar logic
  const selectedDateForModal = ref<YYYYMMDD | null>(null)
  const selectedSchedule = ref<ScheduleWithRelations | null>(null)
  const showScheduleModal = ref(false)

  // Computed properties for chip color logic
  const plannedDates = computed(() => {
    if (!schedules.value) return []
    return schedules.value.map(s => s.date)
  })

  const circuitOverseerDates = computed(() => {
    if (!weekendPrograms.value) return []
    return weekendPrograms.value.filter(p => p.isCircuitOverseerVisit).map(p => p.date)
  })

  const exceptionDates = computed(() => {
    if (!exceptions.value) return []
    return exceptions.value.map(e => e.date)
  })

  // Get chip color for calendar dots
  function getUChipColor(date: DateValue) {
    return getChipColor(date, plannedDates.value, circuitOverseerDates.value, exceptionDates.value)
  }

  function handleDateClick(date: DateValue | DateRange | DateValue[] | null | undefined): void {
    // Only handle single date selection
    if (!date || Array.isArray(date) || (typeof date === "object" && "start" in date)) return
    if (!date || !("day" in date)) return

    // Convert calendar Date to YYYYMMDD
    const dateYYYYMMDD = formatToYYYYMMDD(new Date(date.toString()))
    const dayjsDate = dayjs(dateYYYYMMDD)

    if (dayjsDate.day() !== 0) return // Not Sunday
    if (!dayjsDate.isSameOrAfter(dayjs(), "day")) return // Past date

    // Find existing schedule for this date
    selectedSchedule.value =
      (schedules.value?.find(s => isSameDate(s.date, dateYYYYMMDD)) as
        | ScheduleWithRelations
        | undefined) ?? null

    selectedDateForModal.value = dateYYYYMMDD
    showScheduleModal.value = true
  }

  // Configuration: Number of weeks to display in unscheduled Sundays list
  const WEEKS_TO_SHOW = 26

  const unscheduledSundays = computed(() => {
    const sundays: YYYYMMDD[] = []

    const today = dayjs()
    const currentDayOfWeek = today.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysUntilSunday = currentDayOfWeek === 0 ? 7 : 7 - currentDayOfWeek

    let currentSunday = today.add(daysUntilSunday, "day")

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      const sundayYYYYMMDD = formatToYYYYMMDD(currentSunday.toDate())

      const isScheduled = schedules.value?.some(s => isSameDate(s.date, sundayYYYYMMDD))
      const isException = exceptions.value?.some(e => isSameDate(e.date, sundayYYYYMMDD))

      if (!isScheduled && !isException) {
        sundays.push(sundayYYYYMMDD)
      }

      currentSunday = currentSunday.add(7, "day")
    }

    return sundays
  })

  function handleModalSaved(): void {
    refresh()
    showScheduleModal.value = false
    // Clear selected props to prevent stale state on next open
    selectedSchedule.value = null
    selectedDateForModal.value = null
  }

  function handleSundayClick(sunday: YYYYMMDD): void {
    // Find existing schedule for this date
    selectedSchedule.value =
      (schedules.value?.find(s => isSameDate(s.date, sunday)) as ScheduleWithRelations | undefined) ??
      null

    selectedDateForModal.value = sunday
    showScheduleModal.value = true
  }

  useSeoPage("meetings.manage.publicTalks")
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          data-testid="calendar-title"
          class="text-3xl font-bold tracking-tight text-default">
          {{ t("meetings.managePublicTalks.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("meetings.managePublicTalks.description") }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <AutoSuggestionModal @schedule-created="refresh" />
        <UButton
          data-testid="back-to-list-button"
          variant="outline"
          icon="i-heroicons-list-bullet"
          size="md"
          class="w-full sm:w-auto"
          @click="navigateTo('/meetings/list')">
          {{ t("meetings.backToList") }}
        </UButton>
      </div>
    </div>

    <ClientOnly>
      <UCalendar
        data-testid="schedule-calendar"
        color="primary"
        :number-of-months="numberOfMonths"
        @update:model-value="handleDateClick">
        <template #day="{ day }">
          <UChip
            :show="shouldShowChip(day)"
            color="neutral"
            :ui="getChipColorUI(getUChipColor(day))"
            size="2xs">
            {{ day.day }}
          </UChip>
        </template>
      </UCalendar>

      <template #fallback>
        <div class="h-80 flex items-center justify-center">
          <USkeleton class="h-full w-full" />
        </div>
      </template>
    </ClientOnly>

    <!-- Unscheduled Sundays List -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">{{ t("meetings.unscheduled") }}</h2>
      <div
        v-if="unscheduledSundays.length === 0"
        data-testid="no-unscheduled">
        <UAlert
          color="success"
          :title="t('meetings.allScheduled')"
          icon="i-heroicons-check-circle">
          {{ t("meetings.allScheduledDescription") }}
        </UAlert>
      </div>
      <div
        v-else
        data-testid="unscheduled-list"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard
          v-for="sunday in unscheduledSundays"
          :key="sunday"
          :data-testid="`unscheduled-item-${sunday}`"
          class="cursor-pointer hover:shadow-md transition-shadow hover:bg-elevated"
          @click="handleSundayClick(sunday)">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-calendar-days"
              class="text-warning" />
            <p class="text-sm font-medium">
              {{ dayjs(sunday).format("dddd, D MMMM YYYY") }}
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <ScheduleModal
      v-model:open="showScheduleModal"
      :date="selectedDateForModal"
      :schedule="selectedSchedule"
      @saved="handleModalSaved" />
  </div>
</template>
