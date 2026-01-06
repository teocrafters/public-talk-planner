<script setup lang="ts">
  import type { DateValue } from "@internationalized/date"
  import type { YYYYMMDD } from "#shared/types/date"

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
  const { shouldShowChip } = useCalendarChipColor()

  // Fetch weekend meeting programs for calendar range (6 months)
  const { data: programs, refresh } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: formatToYYYYMMDD(dayjs().subtract(1, "month").toDate()),
      endDate: formatToYYYYMMDD(dayjs().add(6, "month").toDate()),
    },
  })

  // Fetch meeting exceptions - all future exceptions for modal
  const { data: exceptions, refresh: refreshExceptions } = await useFetch(
    "/api/meeting-exceptions",
    {
      query: {
        startDate: formatToYYYYMMDD(dayjs().toDate()),
        endDate: formatToYYYYMMDD(dayjs().add(5, "year").toDate()),
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
    date: YYYYMMDD
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
  const selectedDateForModal = ref<YYYYMMDD | null>(null)
  const selectedProgram = ref<WeekendProgram | null>(null)
  const showPlanningModal = ref(false)

  // Helper function to check if a meeting is complete
  function isMeetingComplete(program: WeekendProgram): boolean {
    // Required parts for a complete meeting (prayer is optional)
    const hasChairman = program.parts.some(p => p.type === "chairman" && p.assignment)
    const hasWatchtower = program.parts.some(p => p.type === "watchtower_study" && p.assignment)
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

    const dateYYYYMMDD = formatToYYYYMMDD(new Date(date.toString()))

    // Priority 1: Check if it's an exception date (highest priority)
    const isException = exceptionDates.value.some(exDate => isSameDate(exDate, dateYYYYMMDD))
    if (isException) return "purple"

    // Priority 2: Check if it's a Circuit Overseer visit
    const isCircuitOverseer = circuitOverseerDates.value.some(coDate =>
      isSameDate(coDate, dateYYYYMMDD)
    )
    if (isCircuitOverseer) return "blue"

    // Priority 3: Check if it's a complete meeting
    const isComplete = completeMeetingDates.value.some(completeDate =>
      isSameDate(completeDate, dateYYYYMMDD)
    )
    if (isComplete) return "green"

    // Priority 4: Check if it's an incomplete meeting
    const isIncomplete = incompleteMeetingDates.value.some(incompleteDate =>
      isSameDate(incompleteDate, dateYYYYMMDD)
    )
    if (isIncomplete) return "yellow"

    // If not planned at all, always red
    return "red"
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

    // Don't allow planning on exception dates
    const isException = exceptionDates.value.some(exDate => isSameDate(exDate, dateYYYYMMDD))
    if (isException) return

    // Find existing program for this date
    selectedProgram.value =
      (programs.value?.find(p => isSameDate(p.date, dateYYYYMMDD)) as WeekendProgram | undefined) ||
      null

    selectedDateForModal.value = dateYYYYMMDD
    showPlanningModal.value = true
  }

  // Unplanned Sundays list
  const WEEKS_TO_SHOW = 26

  const unplannedSundays = computed(() => {
    const sundays: YYYYMMDD[] = []

    const today = dayjs()
    const currentDayOfWeek = today.day()
    const daysUntilSunday = currentDayOfWeek === 0 ? 7 : 7 - currentDayOfWeek

    let currentSunday = today.add(daysUntilSunday, "day")

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      const sundayYYYYMMDD = formatToYYYYMMDD(currentSunday.toDate())

      const isPlanned = programs.value?.some(p => isSameDate(p.date, sundayYYYYMMDD))
      const isException = exceptions.value?.some(e => isSameDate(e.date, sundayYYYYMMDD))

      if (!isPlanned && !isException) {
        sundays.push(sundayYYYYMMDD)
      }

      currentSunday = currentSunday.add(7, "day")
    }

    return sundays
  })

  // Exception modal state
  const showExceptionModal = ref(false)
  const selectedDateForException = ref<YYYYMMDD | null>(null)
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

  function handleSundayClick(sunday: YYYYMMDD): void {
    // Find existing program for this date
    selectedProgram.value =
      (programs.value?.find(p => isSameDate(p.date, sunday)) as WeekendProgram | undefined) || null

    selectedDateForModal.value = sunday
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
          :key="sunday"
          :data-testid="`unplanned-item-${sunday}`"
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

    <WeekendPlanningModal
      v-model:open="showPlanningModal"
      :date="selectedDateForModal"
      :program="selectedProgram"
      @saved="handleModalSaved" />

    <MeetingExceptionModal
      v-model:open="showExceptionModal"
      :date="selectedDateForException"
      :exception="selectedExceptionForEdit"
      :exceptions="exceptions || []"
      @saved="handleExceptionModalSaved" />
  </div>
</template>
