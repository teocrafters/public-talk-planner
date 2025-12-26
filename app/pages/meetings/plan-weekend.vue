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

  // Fetch permissions
  const { can, fetchPermissions } = usePermissions()
  await fetchPermissions()

  // Use composable for calendar chip logic
  const { shouldShowChip, getChipColor } = useCalendarChipColor()

  // Fetch weekend meeting programs for calendar range (3 months)
  const { data: programs, refresh } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: dayjs().subtract(1, "month").unix(),
      endDate: dayjs().add(3, "month").unix(),
    },
  })

  // Fetch meeting exceptions
  const { data: exceptions, refresh: refreshExceptions } = await useFetch(
    "/api/meeting-exceptions",
    {
      query: {
        startDate: dayjs().subtract(1, "month").unix(),
        endDate: dayjs().add(3, "month").unix(),
      },
    }
  )

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

  // Helper function to check if a meeting is complete
  function isMeetingComplete(program: WeekendProgram): boolean {
    // Required parts for a complete meeting (prayer is optional)
    const hasChairman = program.parts.some(
      p => p.type === "chairman" && p.assignment
    )
    const hasWatchtower = program.parts.some(
      p => p.type === "watchtower_study" && p.assignment
    )
    const hasTalk = program.parts.some(
      p => (p.type === "public_talk" || p.type === "circuit_overseer_talk") && p.assignment
    )

    return hasChairman && hasWatchtower && hasTalk
  }

  // Computed properties for chip color logic
  const completeMeetingDates = computed(() => {
    if (!programs.value) return []
    return programs.value.filter(p => isMeetingComplete(p)).map(p => p.date)
  })

  const incompleteMeetingDates = computed(() => {
    if (!programs.value) return []
    return programs.value.filter(p => !isMeetingComplete(p)).map(p => p.date)
  })

  const circuitOverseerDates = computed(() => {
    if (!programs.value) return []
    return programs.value.filter(p => p.isCircuitOverseerVisit).map(p => p.date)
  })

  const exceptionDates = computed(() => {
    if (!exceptions.value) return []
    return exceptions.value.map(e => e.date)
  })

  // Get chip color for calendar dots with meeting completeness logic
  function getUChipColor(date: DateValue) {
    if (!("day" in date)) return "gray"

    const dayjsDate = dayjs(date.toString())
    const dateToCheck = dayjsDate.toDate()

    // Priority 1: Check if it's an exception date (highest priority)
    const isException = exceptionDates.value.some(timestamp => {
      const exceptionDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, exceptionDate)
    })
    if (isException) return "purple"

    // Priority 2: Check if it's a Circuit Overseer visit
    const isCircuitOverseer = circuitOverseerDates.value.some(timestamp => {
      const coDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, coDate)
    })
    if (isCircuitOverseer) return "blue"

    // Priority 3: Check if it's a complete meeting
    const isComplete = completeMeetingDates.value.some(timestamp => {
      const completeDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, completeDate)
    })
    if (isComplete) return "green"

    // Priority 4: Check if it's an incomplete meeting
    const isIncomplete = incompleteMeetingDates.value.some(timestamp => {
      const incompleteDate = dayjs.unix(timestamp).utc().toDate()
      return isSameDay(dateToCheck, incompleteDate)
    })
    if (isIncomplete) return "yellow"

    // If not planned at all, always red
    return "red"
  }

  function handleDateClick(date: DateValue | DateRange | DateValue[] | null | undefined): void {
    // Only handle single date selection
    if (!date || Array.isArray(date) || (typeof date === "object" && "start" in date)) return
    if (!date || !("day" in date)) return

    // Keep the LOCAL date (e.g., 2026-01-11) but normalize time to 11:00 UTC to match DB storage
    const localDate = dayjs(date.toString())
    const dayjsDate = dayjs
      .utc()
      .year(localDate.year())
      .month(localDate.month())
      .date(localDate.date())
      .hour(11)
      .minute(0)
      .second(0)
      .millisecond(0)

    if (dayjsDate.day() !== 0) return // Not Sunday
    if (!dayjsDate.isSameOrAfter(dayjs(), "day")) return // Past date

    // Find existing program for this date
    const dateToCheck = dayjsDate.toDate()
    selectedProgram.value =
      (programs.value?.find(p => {
        const programDate = dayjs.unix(p.date).toDate()
        return isSameDay(dateToCheck, programDate)
      }) as WeekendProgram | undefined) || null

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

      const isPlanned = programs.value?.some(p => {
        const programDate = dayjs.unix(p.date).toDate()
        return isSameDay(sundayDate, programDate)
      })

      const isException = exceptions.value?.some(e => {
        const exceptionDate = dayjs.unix(e.date).toDate()
        return isSameDay(sundayDate, exceptionDate)
      })

      if (!isPlanned && !isException) {
        sundays.push(sundayDate)
      }

      currentSunday = currentSunday.add(7, "day")
    }

    return sundays
  })

  // Exception modal state
  const showExceptionModal = ref(false)
  const selectedDateForException = ref<number | null>(null)
  const selectedExceptionForEdit = ref(null)

  // Check permission for managing exceptions
  const canManageExceptions = computed(() => can("weekend_meetings", "manage_exceptions"))

  function handleModalSaved(): void {
    refresh()
    showPlanningModal.value = false
    // Clear selected props to prevent stale state on next open
    selectedProgram.value = null
    selectedDateForModal.value = null
  }

  function handleExceptionModalSaved(): void {
    refresh()
    refreshExceptions()
    showExceptionModal.value = false
  }

  function openExceptionModal(): void {
    selectedDateForException.value = null
    selectedExceptionForEdit.value = null
    showExceptionModal.value = true
  }

  function handleSundayClick(sunday: Date): void {
    const sundayTimestamp = dateToUnixTimestamp(sunday)
    const sundayDate = dayjs.unix(sundayTimestamp).toDate()

    // Find existing program for this date
    selectedProgram.value =
      (programs.value?.find(p => {
        const programDate = dayjs.unix(p.date).toDate()
        return isSameDay(sundayDate, programDate)
      }) as WeekendProgram | undefined) || null

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

    <!-- Manage Exceptions Button -->
    <div
      v-if="canManageExceptions"
      class="flex justify-end">
      <UButton
        data-testid="manage-exceptions-button"
        icon="i-heroicons-exclamation-triangle"
        variant="outline"
        size="md"
        @click="openExceptionModal">
        {{ t("meetings.meetingExceptions.manageExceptions") }}
      </UButton>
    </div>

    <ClientOnly>
      <UCalendar
        data-testid="weekend-calendar"
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

    <MeetingExceptionModal
      v-model:open="showExceptionModal"
      :date="selectedDateForException"
      :exception="selectedExceptionForEdit"
      @saved="handleExceptionModalSaved" />
  </div>
</template>
