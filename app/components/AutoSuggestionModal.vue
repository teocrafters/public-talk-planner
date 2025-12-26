<script setup lang="ts">
  import { CalendarDate } from "@internationalized/date"
  import type { DateValue } from "@internationalized/date"
  import type {
    AutoSuggestionResponse,
    SpeakerSuggestion,
    TalkSuggestion,
  } from "#shared/utils/schemas"
  import type { ConflictingSchedule } from "#shared/types/api-schedule"

  interface WeekendMeeting {
    id: number
    date: number
    isCircuitOverseerVisit: boolean
    parts: Array<{
      id: number
      type: string
      assignment?: {
        personId: string
        personName: string
        personType: "speaker" | "publisher"
      }
    }>
  }

  const emit = defineEmits<{
    "schedule-created": []
  }>()

  const { t } = useI18n()
  const toast = useToast()
  const { shouldShowChip, getChipColor } = useCalendarChipColor()

  const isOpen = ref(false)
  const isLoading = ref(false)
  const excludedSpeakerIds = ref<string[]>([])
  const currentSpeaker = ref<SpeakerSuggestion | null>(null)
  const availableTalks = ref<TalkSuggestion[]>([])
  const selectedTalkId = ref<number | undefined>(undefined)
  const selectedDate = ref<number | null>(null)
  const hasMoreSuggestions = ref(true)
  const isLocalPublisherFallback = ref(false)
  const showConflictModal = ref(false)
  const conflictingSchedule = ref<ConflictingSchedule | null>(null)

  // Fetch weekend meetings for calendar (6 months range for performance)
  const startOfRange = dayjs().subtract(1, "month").startOf("month").unix()
  const endOfRange = dayjs().add(5, "month").endOf("month").unix()

  const { data: weekendMeetings } = await useFetch<WeekendMeeting[]>("/api/weekend-meetings", {
    query: {
      startDate: startOfRange.toString(),
      endDate: endOfRange.toString(),
    },
  })

  async function fetchSuggestion(excludedIds: string[] = []) {
    isLoading.value = true

    try {
      const response = await $fetch<AutoSuggestionResponse>("/api/auto-suggestion", {
        method: "POST",
        body: { excludedSpeakerIds: excludedIds },
      })

      currentSpeaker.value = response.speaker
      availableTalks.value = response.availableTalks
      selectedTalkId.value = response.availableTalks[0]?.id
      hasMoreSuggestions.value = response.hasMoreSuggestions
      isLocalPublisherFallback.value = response.speaker ? !response.speaker.isVisiting : false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

      toast.add({
        title: t("common.error"),
        description: errorMessage,
        color: "error",
      })

      isOpen.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function skipCurrentSpeaker() {
    if (!currentSpeaker.value) return

    excludedSpeakerIds.value.push(currentSpeaker.value.id)
    await fetchSuggestion(excludedSpeakerIds.value)
  }

  async function confirmSuggestion() {
    if (!selectedTalkId.value || !selectedDate.value || !currentSpeaker.value) {
      toast.add({
        title: t("common.error"),
        description: t("validation.required"),
        color: "error",
      })
      return
    }

    try {
      await $fetch("/api/schedules", {
        method: "POST",
        body: {
          date: selectedDate.value,
          speakerSourceType: isLocalPublisherFallback.value
            ? "local_publisher"
            : "visiting_speaker",
          speakerId: isLocalPublisherFallback.value ? undefined : currentSpeaker.value.id,
          publisherId: isLocalPublisherFallback.value ? currentSpeaker.value.id : undefined,
          talkId: selectedTalkId.value,
        },
      })

      toast.add({
        title: t("meetings.messages.scheduleCreated"),
        color: "success",
      })

      isOpen.value = false
      emit("schedule-created")
    } catch (error: unknown) {
      // Check if it's a 409 conflict error
      if (isApiValidationError(error) && error.data.statusCode === 409) {
        const conflictData = error.data.data as {
          message: string
          conflictingSchedule: ConflictingSchedule
        }

        if (conflictData.conflictingSchedule) {
          conflictingSchedule.value = conflictData.conflictingSchedule
          showConflictModal.value = true
          return
        }
      }

      const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

      toast.add({
        title: t("common.error"),
        description: errorMessage,
        color: "error",
      })
    }
  }

  async function handleOverwriteSchedule() {
    if (!selectedTalkId.value || !selectedDate.value || !currentSpeaker.value) return
    if (!conflictingSchedule.value) return

    try {
      await $fetch(`/api/schedules/${conflictingSchedule.value.id}`, {
        method: "PATCH",
        body: {
          date: selectedDate.value,
          speakerSourceType: isLocalPublisherFallback.value
            ? "local_publisher"
            : "visiting_speaker",
          speakerId: isLocalPublisherFallback.value ? undefined : currentSpeaker.value.id,
          publisherId: isLocalPublisherFallback.value ? currentSpeaker.value.id : undefined,
          talkId: selectedTalkId.value,
        },
      })

      toast.add({
        title: t("meetings.messages.scheduleUpdated"),
        color: "success",
      })

      isOpen.value = false
      emit("schedule-created")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

      toast.add({
        title: t("common.error"),
        description: errorMessage,
        color: "error",
      })
    }
  }

  function handleEditSchedule() {
    // Close auto-suggestion modal - user will use main schedule modal to edit
    isOpen.value = false
    toast.add({
      title: t("common.info"),
      description: "Użyj kalendarza aby edytować istniejący plan",
      color: "info",
    })
  }

  // Computed properties for calendar highlighting
  const plannedDates = computed(() => {
    return (
      weekendMeetings.value
        ?.filter(m => m.parts.some(p => p.type === "public_talk" && p.assignment))
        .map(m => m.date) || []
    )
  })

  const circuitOverseerDates = computed(() => {
    return weekendMeetings.value?.filter(m => m.isCircuitOverseerVisit).map(m => m.date) || []
  })

  // Find first available Sunday (not planned, not CO visit)
  const firstAvailableSunday = computed(() => {
    const today = dayjs()
    let candidate = today.day() === 0 ? today.add(7, "day") : today.day(7) // Next Sunday

    // Check up to 52 weeks ahead
    for (let i = 0; i < 52; i++) {
      const timestamp = candidate.unix()
      const isPlanned = plannedDates.value.some(date => dayjs.unix(date).isSame(candidate, "day"))
      const isCOVisit = circuitOverseerDates.value.some(date =>
        dayjs.unix(date).isSame(candidate, "day")
      )

      if (!isPlanned && !isCOVisit) {
        return timestamp
      }

      candidate = candidate.add(7, "day") // Next Sunday
    }

    // Fallback to next Sunday if no free date found in 52 weeks
    return today.day() === 0 ? today.add(7, "day").unix() : today.day(7).unix()
  })

  watch(isOpen, newValue => {
    if (newValue) {
      excludedSpeakerIds.value = []
      hasMoreSuggestions.value = true
      isLocalPublisherFallback.value = false
      // Set initial suggested date to first available Sunday
      selectedDate.value = firstAvailableSunday.value
      fetchSuggestion()
    }
  })

  const talkItems = computed(
    () =>
      availableTalks.value.map((talk: TalkSuggestion) => ({
        label: `${talk.no} - ${talk.title}`,
        value: talk.id,
      })) || []
  )

  function calendarChipColor(date: DateValue | undefined) {
    if (!date) return "gray" as const
    return getChipColor(date, plannedDates.value, circuitOverseerDates.value, [])
  }

  function shouldCalendarShowChip(date: DateValue | undefined) {
    if (!date) return false
    return shouldShowChip(date)
  }

  function isSundayEnabled(date: DateValue | undefined) {
    if (!date || !("day" in date)) return false
    const dayjsDate = dayjs(date.toString())
    return dayjsDate.day() === 0
  }

  // Convert selectedDate (timestamp) to CalendarDate for UCalendar
  const selectedCalendarDate = computed(() => {
    if (!selectedDate.value) return null

    const dayjsDate = dayjs.unix(selectedDate.value)
    return new CalendarDate(
      dayjsDate.year(),
      dayjsDate.month() + 1, // dayjs month is 0-indexed, CalendarDate expects 1-indexed
      dayjsDate.date()
    )
  })

  function handleDateSelect(date: DateValue | DateRange | DateValue[] | null | undefined) {
    // Handle array (multi-select) - take first date
    let singleDate: DateValue | null | undefined = null

    if (Array.isArray(date)) {
      singleDate = date[0]
    } else if (date && typeof date === "object" && "start" in date) {
      // DateRange - take start date
      singleDate = date.start
    } else {
      singleDate = date
    }

    if (!singleDate || !("day" in singleDate)) return

    // Convert CalendarDate to unix timestamp
    const isoDateString = `${singleDate.year}-${String(singleDate.month).padStart(2, "0")}-${String(singleDate.day).padStart(2, "0")}`
    const dayjsDate = dayjs(isoDateString)
    selectedDate.value = dayjsDate.unix()
  }

  const displaySelectedDate = computed(() => {
    if (!selectedDate.value) return ""
    return formatDatePL(selectedDate.value)
  })

  const displayLastTalkDate = computed(() => {
    if (!currentSpeaker.value?.lastTalkDate) return t("speakers.never")
    return formatDatePL(currentSpeaker.value.lastTalkDate)
  })
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ footer: 'justify-between' }">
    <UButton
      :label="t('meetings.autoSuggestion.button')"
      data-testid="auto-suggestion-button" />

    <template #header>
      <h3 class="text-lg font-semibold">{{ t("meetings.autoSuggestion.modal.title") }}</h3>
    </template>

    <template #body>
      <div data-testid="auto-suggestion-modal">
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-8">
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin text-primary" />
        </div>

        <div
          v-else-if="currentSpeaker"
          class="space-y-6">
          <!-- Speaker Section -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-default">
                {{ t("meetings.autoSuggestion.modal.oldestSpeaker") }}
              </h4>
              <UButton
                size="xs"
                color="info"
                variant="subtle"
                :label="t('meetings.autoSuggestion.skip')"
                :loading="isLoading"
                :disabled="!hasMoreSuggestions || isLoading"
                data-testid="skip-suggestion-button"
                @click="skipCurrentSpeaker" />
            </div>

            <div
              class="rounded-lg border border-default bg-muted p-4"
              data-testid="selected-speaker-info">
              <p class="font-semibold text-default">
                {{ currentSpeaker.firstName }} {{ currentSpeaker.lastName }}
              </p>
              <p class="text-sm text-muted">{{ currentSpeaker.congregationName }}</p>
              <p class="mt-2 text-sm text-muted">
                {{ t("meetings.autoSuggestion.modal.contactInfo") }}: {{ currentSpeaker.phone }}
              </p>
              <p class="text-sm text-muted">
                {{ t("speakers.lastTalkDate") }}: {{ displayLastTalkDate }}
              </p>
            </div>

            <!-- Fallback message for local publisher -->
            <div
              v-if="isLocalPublisherFallback"
              class="mt-3 rounded-lg border border-warning bg-warning/10 p-3"
              data-testid="fallback-message">
              <p class="text-sm text-warning">
                {{ t("meetings.autoSuggestion.fallback.noVisitingSpeakers") }}
              </p>
              <p class="text-sm text-warning">
                {{ t("meetings.autoSuggestion.fallback.localPublisherSuggestion") }}
              </p>
            </div>
          </div>

          <!-- Available Talks -->
          <div>
            <h4 class="mb-2 text-sm font-semibold text-default">
              {{ t("meetings.autoSuggestion.modal.availableTalks") }}
            </h4>
            <UFormField name="talkId">
              <USelectMenu
                v-model="selectedTalkId"
                data-testid="suggested-talks-list"
                :items="talkItems"
                value-key="value"
                class="w-full" />
            </UFormField>
          </div>

          <!-- Calendar -->
          <div>
            <h4 class="mb-2 text-sm font-semibold text-default">
              {{ t("meetings.autoSuggestion.modal.selectDate") }}
            </h4>

            <div class="mb-2 text-sm text-muted">
              {{ t("meetings.unscheduled") }}: {{ displaySelectedDate }}
            </div>

            <UCalendar
              :model-value="selectedCalendarDate"
              data-testid="auto-suggestion-calendar"
              :is-date-disabled="date => !isSundayEnabled(date)"
              @update:model-value="handleDateSelect">
              <template #day="{ day }">
                <UChip
                  :show="shouldCalendarShowChip(day)"
                  color="neutral"
                  :ui="getChipColorUI(calendarChipColor(day))"
                  size="2xs">
                  {{ day.day }}
                </UChip>
              </template>
            </UCalendar>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="ghost"
        data-testid="cancel-suggestion-button"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        :disabled="!selectedTalkId || !selectedDate"
        data-testid="confirm-suggestion-button"
        @click="confirmSuggestion">
        {{ t("meetings.autoSuggestion.modal.confirm") }}
      </UButton>
    </template>
  </UModal>

  <!-- Conflict Modal -->
  <ScheduleConflictModal
    v-model:open="showConflictModal"
    :conflict="conflictingSchedule"
    @edit="handleEditSchedule"
    @overwrite="handleOverwriteSchedule" />
</template>
