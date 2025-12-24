<script setup lang="ts">
  import type { FormSubmitEvent } from "#ui/types"
  import type { DateValue } from "@internationalized/date"
  import type { MeetingException } from "#shared/types/api-meeting-exceptions"
  import { MEETING_EXCEPTION_TYPES } from "#shared/constants/meeting-exceptions"
  import type { MeetingExceptionType } from "#shared/constants/meeting-exceptions"

  type DateRange = { start: DateValue | undefined; end: DateValue | undefined }

  interface Props {
    date: number | null
    exception?: MeetingException | null
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    saved: []
  }>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const { t } = useI18n()
  const toast = useToast()

  // Form state
  const state = reactive<{
    selectedDate: number | undefined
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
    date: number
    isCircuitOverseerVisit: boolean
    parts: Array<{ type: string; personName: string }>
  } | null>(null)

  const isEditMode = computed(() => !!props.exception)

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

  // Whether a date is pre-selected (from calendar click)
  const hasPreselectedDate = computed(() => !!props.date)

  // Check if a date is a Sunday in the future
  function isSundayInFuture(date: DateValue): boolean {
    if (!("day" in date)) return false
    const dayjsDate = dayjs(date.toString())
    return dayjsDate.day() === 0 && dayjsDate.isAfter(dayjs(), "day")
  }

  // Handle calendar date selection
  function handleCalendarDateSelect(
    value: DateValue | DateRange | DateValue[] | null | undefined
  ): void {
    if (!value || Array.isArray(value)) return
    if (typeof value === "object" && "start" in value) return
    if (!("day" in value)) return
    // Normalize to 11:00 UTC to match meeting storage
    const localDate = dayjs(value.toString())
    const dayjsDate = dayjs
      .utc()
      .year(localDate.year())
      .month(localDate.month())
      .date(localDate.date())
      .hour(11)
      .minute(0)
      .second(0)
      .millisecond(0)
    state.selectedDate = dayjsDate.unix()
  }

  // Watch for modal opening - populate form based on mode
  watch(isOpen, open => {
    if (open) {
      existingMeetingConflict.value = null
      if (props.exception) {
        // Edit mode: populate form with existing exception data
        state.selectedDate = props.exception.date
        state.exceptionType = props.exception.exceptionType
        state.description = props.exception.description || ""
        state.confirmDeleteExisting = false
      } else {
        // Create mode: reset form
        state.selectedDate = props.date || undefined
        state.exceptionType = undefined
        state.description = ""
        state.confirmDeleteExisting = false
      }
    } else {
      // Reset conflict state when closing
      existingMeetingConflict.value = null
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
      if (isEditMode.value && props.exception) {
        // Edit mode: PATCH request
        await $fetch(`/api/meeting-exceptions/${props.exception.id}`, {
          method: "PATCH",
          body: {
            exceptionType: event.data.exceptionType || undefined,
            description: event.data.description || null,
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
      isOpen.value = false
    } catch (error: unknown) {
      // Handle 409 conflict - existing meeting
      if (isApiValidationError(error) && error.data.statusCode === 409) {
        const responseData = error.data.data as Record<string, unknown>
        if ("meeting" in responseData && responseData.meeting) {
          existingMeetingConflict.value = responseData.meeting as {
            id: number
            date: number
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
    if (!props.exception) return
    showDeleteConfirm.value = true
  }

  async function executeDelete() {
    if (!props.exception) return

    isLoading.value = true

    try {
      await $fetch(`/api/meeting-exceptions/${props.exception.id}`, {
        method: "DELETE",
      })

      toast.add({
        title: t("common.success"),
        description: t("meetings.meetingExceptions.messages.exceptionDeleted"),
        color: "success",
      })

      emit("saved")
      isOpen.value = false
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
    :ui="{ footer: 'justify-between' }"
    class="sm:max-w-2xl">
    <template #body>
      <UForm
        ref="form"
        data-testid="meeting-exception-form"
        :state="state"
        @submit="onSubmit">
        <div class="space-y-4">
          <div class="text-center mb-4">
            <h2
              data-testid="modal-title"
              class="text-2xl font-bold text-default">
              {{
                isEditMode
                  ? t("meetings.meetingExceptions.editException")
                  : t("meetings.meetingExceptions.createException")
              }}
            </h2>
            <p
              v-if="formattedDate"
              class="text-sm text-muted mt-1">
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
                :week-starts-on="1"
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
      <UButton
        variant="outline"
        :label="t('common.cancel')"
        data-testid="exception-cancel-button"
        @click="close" />
      <div class="flex gap-2">
        <UButton
          v-if="isEditMode"
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
