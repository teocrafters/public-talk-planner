<script setup lang="ts">
  import type { DateValue } from "@internationalized/date"

  type DateRange = { start: DateValue | undefined; end: DateValue | undefined }

  definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
    middleware: ["weekend-meetings-manager"],
  })

  const { t } = useI18n()

  // Fetch weekend meeting programs for calendar range (3 months)
  const { data: programs, refresh } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: dayjs().subtract(1, "month").unix(),
      endDate: dayjs().add(3, "month").unix(),
    },
  })

  // Responsive months display
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

  interface WeekendProgram {
    id: number
    date: number
    isCircuitOverseerVisit: boolean
    parts: Array<{
      id: number
      type: string
      name: string | null
      order: number
      assignment?: {
        personId: string
        personName: string
        personType: "speaker" | "publisher"
      }
    }>
  }

  // Calendar logic
  const selectedDateForModal = ref<number | null>(null)
  const selectedProgram = ref<WeekendProgram | null>(null)
  const showPlanningModal = ref(false)

  function isSundayUnplanned(date: DateValue): boolean {
    if (!("day" in date)) return false
    const dayjsDate = dayjs(date.toString())

    if (dayjsDate.day() !== 0) return false // Not Sunday
    if (!dayjsDate.isSameOrAfter(dayjs(), "day")) return false // Past date

    const planned = programs.value?.find(p => dayjs.unix(p.date).utc().isSame(dayjsDate, "day"))
    return !planned
  }

  function handleDateClick(date: DateValue | DateRange | DateValue[] | null | undefined): void {
    // Only handle single date selection
    if (!date || Array.isArray(date) || (typeof date === "object" && "start" in date)) return
    if (!date || !("day" in date)) return

    const dayjsDate = dayjs(date.toString())

    if (dayjsDate.day() !== 0) return // Not Sunday
    if (!dayjsDate.isSameOrAfter(dayjs(), "day")) return // Past date

    // Find existing program for this date
    selectedProgram.value =
      (programs.value?.find(p => dayjs.unix(p.date).utc().isSame(dayjsDate, "day")) as
        | WeekendProgram
        | undefined) || null

    selectedDateForModal.value = dayjsDate.unix()
    showPlanningModal.value = true
  }

  // Unplanned Sundays list
  const WEEKS_TO_SHOW = 26

  const unplannedSundays = computed(() => {
    const sundays: Date[] = []

    // Start from today at noon to avoid timezone boundary issues
    const todayAtNoon = dayjs().utc().hour(12).minute(0).second(0).millisecond(0)

    const currentDayOfWeek = todayAtNoon.day()
    const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek

    let currentSunday = todayAtNoon.add(daysUntilSunday, "day")

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      const sundayDate = currentSunday.toDate()

      const isPlanned = programs.value?.some(p =>
        dayjs.unix(p.date).utc().isSame(currentSunday, "day")
      )

      if (!isPlanned) {
        sundays.push(sundayDate)
      }

      currentSunday = currentSunday.add(7, "day")
    }

    return sundays
  })

  function handleModalSaved(): void {
    refresh()
    showPlanningModal.value = false
  }

  function handleSundayClick(sunday: Date): void {
    const sundayTimestamp = dateToUnixTimestamp(sunday)

    // Find existing program for this date
    selectedProgram.value =
      (programs.value?.find(p =>
        dayjs.unix(p.date).utc().isSame(dayjs.unix(sundayTimestamp), "day")
      ) as WeekendProgram | undefined) || null

    selectedDateForModal.value = sundayTimestamp
    showPlanningModal.value = true
  }

  useSeoPage("meetings.planWeekend")
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          data-testid="weekend-planner-title"
          class="text-3xl font-bold tracking-tight text-default">
          {{ t("weekendMeetings.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("weekendMeetings.title") }}
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
        data-testid="weekend-calendar"
        color="primary"
        :week-starts-on="1"
        :number-of-months="numberOfMonths"
        @update:model-value="handleDateClick">
        <template #day="{ day }">
          <UChip
            :show="isSundayUnplanned(day)"
            :color="isSundayUnplanned(day) ? 'warning' : 'success'"
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

    <!-- Unplanned Sundays List -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">{{ t("meetings.unscheduled") }}</h2>
      <div
        v-if="unplannedSundays.length === 0"
        data-testid="no-unplanned">
        <UAlert
          color="success"
          :title="t('meetings.allScheduled')"
          icon="i-heroicons-check-circle">
          {{ t("meetings.allScheduledDescription") }}
        </UAlert>
      </div>
      <div
        v-else
        data-testid="unplanned-list"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard
          v-for="sunday in unplannedSundays"
          :key="sunday.toISOString()"
          :data-testid="`unplanned-item-${sunday.toISOString().split('T')[0]}`"
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

    <WeekendPlanningModal
      v-model:open="showPlanningModal"
      :date="selectedDateForModal"
      :program="selectedProgram"
      @saved="handleModalSaved" />
  </div>
</template>
