<script setup lang="ts">
  import type { DateValue } from "@internationalized/date"

  type DateRange = { start: DateValue | undefined; end: DateValue | undefined }

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
      startDate: dayjs().subtract(1, "month").toDate().toISOString(),
      endDate: dayjs().add(3, "month").toDate().toISOString(),
    },
  })

  // Fetch weekend meetings for Circuit Overseer visit info
  const { data: weekendPrograms } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: dayjs().subtract(1, "month").unix(),
      endDate: dayjs().add(3, "month").unix(),
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
  const selectedDateForModal = ref<number | null>(null)
  const selectedSchedule = ref<ScheduleWithRelations | null>(null)
  const showScheduleModal = ref(false)

  // Computed properties for chip color logic
  const plannedDates = computed(() => {
    if (!schedules.value) return []
    return schedules.value.map(s => dayjs(s.date).unix())
  })

  const circuitOverseerDates = computed(() => {
    if (!weekendPrograms.value) return []
    return weekendPrograms.value.filter(p => p.isCircuitOverseerVisit).map(p => p.date)
  })

  function handleDateClick(date: DateValue | DateRange | DateValue[] | null | undefined): void {
    // Only handle single date selection
    if (!date || Array.isArray(date) || (typeof date === "object" && "start" in date)) return
    if (!date || !("day" in date)) return

    const dayjsDate = dayjs(date.toString())

    if (dayjsDate.day() !== 0) return // Not Sunday
    if (!dayjsDate.isSameOrAfter(dayjs(), "day")) return // Past date

    // Find existing schedule for this date
    selectedSchedule.value = schedules.value?.find(s =>
      dayjs(s.date).isSame(dayjsDate, "day")
    ) as unknown as ScheduleWithRelations | null

    selectedDateForModal.value = dayjsDate.unix()
    showScheduleModal.value = true
  }

  // Configuration: Number of weeks to display in unscheduled Sundays list
  const WEEKS_TO_SHOW = 26

  const unscheduledSundays = computed(() => {
    const sundays: Date[] = []

    // Start from today at noon to avoid timezone boundary issues
    const todayAtNoon = dayjs().utc().hour(12).minute(0).second(0).millisecond(0)

    const currentDayOfWeek = todayAtNoon.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek

    let currentSunday = todayAtNoon.add(daysUntilSunday, "day")

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      const sundayDate = currentSunday.toDate()

      const isScheduled = schedules.value?.some(s => isSameDay(s.date, sundayDate))

      if (!isScheduled) {
        sundays.push(sundayDate)
      }

      currentSunday = currentSunday.add(7, "day")
    }

    return sundays
  })

  function handleModalSaved(): void {
    refresh()
    showScheduleModal.value = false
  }

  function handleSundayClick(sunday: Date): void {
    // Find existing schedule for this date
    selectedSchedule.value = schedules.value?.find(s =>
      isSameDay(s.date, sunday)
    ) as unknown as ScheduleWithRelations | null

    selectedDateForModal.value = dateToUnixTimestamp(sunday)
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

    <ClientOnly>
      <UCalendar
        data-testid="schedule-calendar"
        color="primary"
        :week-starts-on="1"
        :number-of-months="numberOfMonths"
        @update:model-value="handleDateClick">
        <template #day="{ day }">
          <UChip
            :show="shouldShowChip(day)"
            :color="getChipColor(day, plannedDates, circuitOverseerDates)"
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
          :key="sunday.toISOString()"
          :data-testid="`unscheduled-item-${sunday.toISOString().split('T')[0]}`"
          class="cursor-pointer hover:shadow-md transition-shadow hover:bg-elevated"
          @click="handleSundayClick(sunday)">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-calendar-days"
              class="text-warning" />
            <p class="text-sm font-medium">
              {{ formatDatePL(sunday) }}
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
