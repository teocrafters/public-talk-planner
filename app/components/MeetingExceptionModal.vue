<script setup lang="ts">
  import type { FormSubmitEvent } from "#ui/types"
  import type { DateValue } from "@internationalized/date"
  import type { MeetingException } from "#shared/types/api-meeting-exceptions"
  import { MEETING_EXCEPTION_TYPES } from "#shared/constants/meeting-exceptions"
  import type { MeetingExceptionType } from "#shared/constants/meeting-exceptions"
  import type { YYYYMMDD } from "#shared/types/date"

  type DateRange = { start: DateValue | undefined; end: DateValue | undefined }

  // Exception list item type for props (compatible with serialized API response)
  type ExceptionListItem = {
    id: string
    date: YYYYMMDD
    exceptionType: MeetingExceptionType
    description: string | null
  }

  interface Props {
    date: YYYYMMDD | null
    exception?: MeetingException | null
    exceptions: ExceptionListItem[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    saved: []
  }>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const { t } = useI18n()
  const toast = useToast()

  // View mode state
  type ViewMode = "browse" | "create" | "edit"
  const viewMode = ref<ViewMode>("browse")
  const selectedExceptionForEdit = ref<MeetingException | null>(null)
  const selectedDateForCreate = ref<YYYYMMDD | null>(null)

  // Form state
  const state = reactive<{
    selectedDate: YYYYMMDD | undefined
    exceptionType: MeetingExceptionType | undefined
    description: string
    confirmDeleteExisting: boolean
  }>({
    selectedDate: undefined,
    exceptionType: undefined,
    description: "",
    confirmDeleteExisting: false,
  })

  // Exception type options
  const exceptionTypeOptions = [
    {
      value: MEETING_EXCEPTION_TYPES.CIRCUIT_ASSEMBLY,
      label: t("meetings.meetingExceptions.types.circuit_assembly"),
    },
    {
      value: MEETING_EXCEPTION_TYPES.REGIONAL_CONVENTION,
      label: t("meetings.meetingExceptions.types.regional_convention"),
    },
    {
      value: MEETING_EXCEPTION_TYPES.MEMORIAL,
      label: t("meetings.meetingExceptions.types.memorial"),
    },
  ]

  // Form instance ref
  const form = useTemplateRef("form")
  const isLoading = ref(false)
  const showDeleteConfirm = ref(false)
  const existingMeetingConflict = ref<{
    id: number
    date: YYYYMMDD
    isCircuitOverseerVisit: boolean
    parts: Array<{ type: string; personName: string }>
  } | null>(null)

  const isEditMode = computed(() => viewMode.value === "edit")

  // Convert snake_case part type to camelCase i18n key
  function getMeetingPartKey(type: string): string {
    // Map snake_case database values to camelCase i18n keys
    const typeMap: Record<string, string> = {
      chairman: "weekendMeetings.parts.chairman",
      watchtower_study: "weekendMeetings.parts.watchtowerStudy",
      reader: "weekendMeetings.parts.reader",
      closing_prayer: "weekendMeetings.parts.closingPrayer",
      public_talk: "weekendMeetings.parts.publicTalk",
    }
    return typeMap[type] || type
  }

  // Formatted date for display
  const formattedDate = computed(() => {
    const dateToFormat = props.date || state.selectedDate
    if (!dateToFormat) return ""
    return formatDatePL(dateToFormat)
  })

  // Filtered and sorted future exceptions for list display
  const futureExceptions = computed(() => {
    return props.exceptions
      .filter(e => dayjs(e.date).isSameOrAfter(dayjs(), "day"))
      .sort((a, b) => a.date.localeCompare(b.date))
  })

  // Exception dates array for calendar chips
  const exceptionDates = computed(() => {
    return props.exceptions.map(e => e.date)
  })

  // Whether a date is pre-selected (from calendar click)
  const hasPreselectedDate = computed(() => !!props.date)

  // Check if a date is a Sunday in the future
  function isSundayInFuture(date: DateValue): boolean {
    if (!("day" in date)) return false
    const dayjsDate = dayjs(date.toString())
    return dayjsDate.day() === 0 && dayjsDate.isAfter(dayjs(), "day")
  }

  // Handle calendar date selection (for create mode with calendar)
  function handleCalendarDateSelect(
    value: DateValue | DateRange | DateValue[] | null | undefined
  ): void {
    if (!value || Array.isArray(value)) return
    if (typeof value === "object" && "start" in value) return
    if (!("day" in value)) return
    // Convert calendar Date to YYYYMMDD
    state.selectedDate = formatToYYYYMMDD(new Date(value.toString()))
  }

  // Handle calendar date click in browse mode
  function handleBrowseCalendarClick(
    value: DateValue | DateRange | DateValue[] | null | undefined
  ): void {
    if (!value || Array.isArray(value)) return
    if (typeof value === "object" && "start" in value) return
    if (!("day" in value)) return

    const dateYYYYMMDD = formatToYYYYMMDD(new Date(value.toString()))
    const dayjsDate = dayjs(dateYYYYMMDD)

    // Must be Sunday in future
    if (dayjsDate.day() !== 0 || !dayjsDate.isSameOrAfter(dayjs(), "day")) return

    // Check if exception exists on this date
    const existingException = props.exceptions.find(e => isSameDate(e.date, dateYYYYMMDD))

    if (existingException) {
      // Edit existing exception
      handleEditException(existingException)
    } else {
      // Create new exception
      handleCreateException(dateYYYYMMDD)
    }
  }

  // Get chip color for browse calendar (purple for exceptions, gray otherwise)
  function getBrowseCalendarChipColor(date: DateValue): "purple" | "gray" {
    if (!("day" in date)) return "gray"
    const dateYYYYMMDD = formatToYYYYMMDD(new Date(date.toString()))
    const isException = exceptionDates.value.some(exDate => isSameDate(exDate, dateYYYYMMDD))
    return isException ? "purple" : "gray"
  }

  // Check if chip should show on browse calendar (only Sundays in future)
  function shouldShowBrowseChip(date: DateValue): boolean {
    if (!("day" in date)) return false
    const dayjsDate = dayjs(date.toString())
    return dayjsDate.day() === 0 && dayjsDate.isSameOrAfter(dayjs(), "day")
  }

  // Transition to create mode
  function handleCreateException(date: YYYYMMDD): void {
    selectedDateForCreate.value = date
    state.selectedDate = date
    state.exceptionType = undefined
    state.description = ""
    state.confirmDeleteExisting = false
    existingMeetingConflict.value = null
    viewMode.value = "create"
  }

  // Transition to edit mode
  function handleEditException(exception: ExceptionListItem | MeetingException): void {
    selectedExceptionForEdit.value = exception as MeetingException
    state.selectedDate = exception.date
    state.exceptionType = exception.exceptionType
    state.description = exception.description || ""
    state.confirmDeleteExisting = false
    existingMeetingConflict.value = null
    viewMode.value = "edit"
  }

  // Back to browse mode
  function handleBackToBrowse(): void {
    viewMode.value = "browse"
    selectedExceptionForEdit.value = null
    selectedDateForCreate.value = null
    existingMeetingConflict.value = null
  }

  // Get exception type label for display
  function getExceptionTypeLabel(type: MeetingExceptionType): string {
    const option = exceptionTypeOptions.find(opt => opt.value === type)
    return option?.label || type
  }

  // Watch for modal opening - populate form based on mode
  watch(isOpen, open => {
    if (open) {
      existingMeetingConflict.value = null

      // Determine initial view mode
      if (props.exception) {
        // Direct edit mode from parent
        viewMode.value = "edit"
        selectedExceptionForEdit.value = props.exception
        state.selectedDate = props.exception.date
        state.exceptionType = props.exception.exceptionType
        state.description = props.exception.description || ""
        state.confirmDeleteExisting = false
      } else if (props.date) {
        // Direct create mode from parent with preselected date
        viewMode.value = "create"
        selectedDateForCreate.value = props.date
        state.selectedDate = props.date
        state.exceptionType = undefined
        state.description = ""
        state.confirmDeleteExisting = false
      } else {
        // Browse mode - show calendar and list
        viewMode.value = "browse"
        selectedExceptionForEdit.value = null
        selectedDateForCreate.value = null
      }
    } else {
      // Reset all state when closing
      existingMeetingConflict.value = null
      viewMode.value = "browse"
      selectedExceptionForEdit.value = null
      selectedDateForCreate.value = null
    }
  })

  async function onSubmit(event: FormSubmitEvent<typeof state>) {
    const dateToUse = state.selectedDate

    if (!dateToUse && !isEditMode.value) {
      toast.add({
        title: t("common.error"),
        description: t("validation.dateRequired"),
        color: "error",
      })
      return
    }

    isLoading.value = true

    try {
      if (isEditMode.value && selectedExceptionForEdit.value) {
        // Edit mode: PATCH request
        await $fetch(`/api/meeting-exceptions/${selectedExceptionForEdit.value.id}`, {
          method: "PATCH",
          body: {
            date: state.selectedDate,
            exceptionType: event.data.exceptionType || undefined,
            description: event.data.description || null,
            confirmDeleteExisting: event.data.confirmDeleteExisting,
          },
        })

        toast.add({
          title: t("common.success"),
          description: t("meetings.meetingExceptions.messages.exceptionUpdated"),
          color: "success",
        })
      } else {
        // Create mode: POST request
        await $fetch("/api/meeting-exceptions", {
          method: "POST",
          body: {
            date: dateToUse,
            exceptionType: event.data.exceptionType,
            description: event.data.description || undefined,
            confirmDeleteExisting: event.data.confirmDeleteExisting,
          },
        })

        toast.add({
          title: t("common.success"),
          description: t("meetings.meetingExceptions.messages.exceptionCreated"),
          color: "success",
        })
      }

      emit("saved")
      viewMode.value = "browse"
    } catch (error: unknown) {
      // Handle 409 conflict - existing meeting
      if (isApiValidationError(error) && error.data.statusCode === 409) {
        const responseData = error.data.data as Record<string, unknown>
        if ("meeting" in responseData && responseData.meeting) {
          existingMeetingConflict.value = responseData.meeting as {
            id: number
            date: YYYYMMDD
            isCircuitOverseerVisit: boolean
            parts: Array<{ type: string; personName: string }>
          }
          state.confirmDeleteExisting = false
          isLoading.value = false
          return
        }
      }

      if (isApiZodValidationError(error)) {
        const firstError = error.data.data.errors[0]
        toast.add({
          title: t("common.error"),
          description: t(firstError?.messageKey || "errors.unexpectedError"),
          color: "error",
        })
      } else if (isApiValidationError(error)) {
        toast.add({
          title: t("common.error"),
          description: t(error.data.data.message),
          color: "error",
        })
      } else {
        toast.add({
          title: t("common.error"),
          description: t("errors.unexpectedError"),
          color: "error",
        })
      }
    } finally {
      isLoading.value = false
    }
  }

  async function handleDelete() {
    if (!selectedExceptionForEdit.value) return
    showDeleteConfirm.value = true
  }

  async function executeDelete() {
    if (!selectedExceptionForEdit.value) return

    isLoading.value = true

    try {
      await $fetch(`/api/meeting-exceptions/${selectedExceptionForEdit.value.id}`, {
        method: "DELETE",
      })

      toast.add({
        title: t("common.success"),
        description: t("meetings.meetingExceptions.messages.exceptionDeleted"),
        color: "success",
      })

      emit("saved")
      viewMode.value = "browse"
    } catch (error: unknown) {
      if (isApiValidationError(error)) {
        toast.add({
          title: t("common.error"),
          description: t(error.data.data.message),
          color: "error",
        })
      } else {
        toast.add({
          title: t("common.error"),
          description: t("errors.unexpectedError"),
          color: "error",
        })
      }
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    data-testid="manage-exceptions-modal"
    :ui="{ footer: 'justify-between' }"
    class="sm:max-w-4xl">
    <template #title>
      <span v-if="viewMode === 'browse'">
        {{ t("meetings.meetingExceptions.manageExceptions") }}
      </span>
      <span v-else-if="viewMode === 'create'">
        {{ t("meetings.meetingExceptions.createException") }}
      </span>
      <span v-else>
        {{ t("meetings.meetingExceptions.editException") }}
      </span>
    </template>

    <template #body>
      <!-- BROWSE MODE: Calendar + Exception List -->
      <div
        v-if="viewMode === 'browse'"
        data-testid="exception-browse-view"
        class="space-y-6">
        <!-- Instruction text -->
        <UAlert
          color="info"
          variant="subtle"
          :title="t('meetings.meetingExceptions.browseInstructions')"
          icon="i-heroicons-information-circle" />

        <!-- Two-column layout: Calendar + List -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Calendar Column -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-default">
              {{ t("meetings.meetingExceptions.calendar") }}
            </h3>
            <ClientOnly>
              <UCalendar
                data-testid="exceptions-calendar"
                color="primary"
                :number-of-months="1"
                @update:model-value="handleBrowseCalendarClick">
                <template #day="{ day }">
                  <UChip
                    :show="shouldShowBrowseChip(day)"
                    color="neutral"
                    :ui="getChipColorUI(getBrowseCalendarChipColor(day))"
                    size="2xs">
                    {{ day.day }}
                  </UChip>
                </template>
              </UCalendar>
              <template #fallback>
                <div class="h-64 flex items-center justify-center">
                  <USkeleton class="h-full w-full" />
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Exception List Column -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-default">
              {{ t("meetings.meetingExceptions.upcomingExceptions") }}
            </h3>

            <!-- Empty state -->
            <div
              v-if="futureExceptions.length === 0"
              data-testid="exception-list-empty"
              class="text-center py-12">
              <UIcon
                name="i-heroicons-calendar-days"
                class="text-muted text-4xl mb-2" />
              <p class="text-muted">
                {{ t("meetings.meetingExceptions.noUpcomingExceptions") }}
              </p>
            </div>

            <!-- Exception list with scrolling -->
            <div
              v-else
              data-testid="exceptions-list"
              class="space-y-2 max-h-96 overflow-y-auto">
              <UCard
                v-for="item in futureExceptions"
                :key="item.id"
                :data-testid="`exception-list-item-${item.id}`"
                class="cursor-pointer hover:bg-elevated hover:shadow-md transition-all"
                @click="handleEditException(item)">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-default">
                      {{ formatDatePL(item.date) }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <UBadge
                        color="primary"
                        variant="subtle"
                        size="sm">
                        {{ getExceptionTypeLabel(item.exceptionType) }}
                      </UBadge>
                    </div>
                    <p
                      v-if="item.description"
                      class="text-sm text-muted mt-2 line-clamp-2">
                      {{ item.description }}
                    </p>
                  </div>
                  <UIcon
                    name="i-heroicons-chevron-right"
                    class="text-muted flex-shrink-0" />
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>

      <!-- CREATE/EDIT MODE: Form -->
      <UForm
        v-else
        ref="form"
        data-testid="exception-form-view"
        :state="state"
        @submit="onSubmit">
        <div class="space-y-4">
          <div
            v-if="formattedDate"
            class="text-center mb-4">
            <p class="text-sm text-muted">
              {{ formattedDate }}
            </p>
          </div>

          <!-- Date Selection Calendar (only in create mode without preselected date) -->
          <div
            v-if="!hasPreselectedDate && !isEditMode"
            class="mb-4">
            <label class="block text-sm font-medium mb-2 text-default">
              {{ t("validation.dateRequired") }} *
            </label>
            <ClientOnly>
              <UCalendar
                data-testid="exception-date-calendar"
                color="primary"
                :is-date-disabled="date => !isSundayInFuture(date)"
                @update:model-value="handleCalendarDateSelect" />
              <template #fallback>
                <div class="h-64 flex items-center justify-center">
                  <USkeleton class="h-full w-full" />
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Exception Type Select -->
          <UFormField
            :label="t('meetings.meetingExceptions.exceptionType')"
            name="exceptionType"
            required>
            <USelectMenu
              v-model="state.exceptionType"
              class="w-full"
              data-testid="exception-type-select"
              :items="exceptionTypeOptions"
              :placeholder="t('meetings.meetingExceptions.exceptionType')"
              value-key="value" />
          </UFormField>

          <!-- Description Textarea -->
          <UFormField
            :label="t('meetings.meetingExceptions.description')"
            name="description">
            <UTextarea
              v-model="state.description"
              class="w-full"
              data-testid="exception-description-textarea"
              :placeholder="t('meetings.meetingExceptions.description')"
              :maxlength="500"
              :rows="3" />
          </UFormField>

          <!-- Existing Meeting Conflict Warning -->
          <UAlert
            v-if="existingMeetingConflict"
            data-testid="existing-meeting-alert"
            color="warning"
            variant="subtle"
            :title="t('meetings.meetingExceptions.confirmDeleteMeeting')"
            :description="
              t('meetings.meetingExceptions.confirmDeleteMeetingDescription', {
                date: formattedDate,
              })
            ">
            <template #description>
              <p class="mb-2">
                {{
                  t("meetings.meetingExceptions.confirmDeleteMeetingDescription", {
                    date: formattedDate,
                  })
                }}
              </p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li
                  v-for="(part, index) in existingMeetingConflict.parts"
                  :key="index">
                  {{ t(getMeetingPartKey(part.type)) }}: {{ part.personName }}
                </li>
              </ul>
              <UCheckbox
                v-model="state.confirmDeleteExisting"
                data-testid="exception-confirm-delete-checkbox"
                :label="t('meetings.meetingExceptions.confirmDeleteMeeting')"
                class="mt-3" />
            </template>
          </UAlert>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <!-- Browse Mode Footer -->
      <template v-if="viewMode === 'browse'">
        <UButton
          variant="outline"
          :label="t('common.cancel')"
          data-testid="exception-close-button"
          @click="close" />
      </template>

      <!-- Create/Edit Mode Footer -->
      <template v-else>
        <UButton
          variant="outline"
          :label="t('common.cancel')"
          data-testid="exception-cancel-button"
          @click="handleBackToBrowse" />
        <div class="flex gap-2">
          <UButton
            v-if="viewMode === 'edit'"
            color="error"
            :label="t('meetings.meetingExceptions.deleteException')"
            data-testid="exception-delete-button"
            :loading="isLoading"
            @click="handleDelete" />
          <UButton
            type="submit"
            :label="t('common.submit')"
            data-testid="exception-save-button"
            :loading="isLoading"
            @click="form?.submit()" />
        </div>
      </template>
    </template>
  </UModal>

  <ConfirmDialog
    v-model="showDeleteConfirm"
    :title="t('meetings.meetingExceptions.confirmDeleteExceptionTitle')"
    :message="t('meetings.meetingExceptions.confirmDeleteExceptionDescription')"
    :confirm-text="t('common.delete')"
    :cancel-text="t('common.cancel')"
    variant="danger"
    @confirm="executeDelete" />
</template>
