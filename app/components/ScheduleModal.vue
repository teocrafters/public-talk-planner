<script setup lang="ts">
  import { createScheduleSchema } from "#shared/utils/schemas"
  import { SPEAKER_SOURCE_TYPES, type SpeakerSourceType } from "#shared/constants/speaker-sources"
  import type { ConflictingSchedule } from "#shared/types/api-schedule"
  import type { YYYYMMDD } from "#shared/types/date"

  interface Props {
    date: YYYYMMDD | null
    schedule?: ScheduleWithRelations | null
  }

  const props = defineProps<Props>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const emit = defineEmits<{
    saved: []
  }>()

  const { t } = useI18n()
  const toast = useToast()

  const isSubmitting = ref(false)
  const showOverrideWarning = ref(false)
  const showConflictModal = ref(false)
  const conflictingSchedule = ref<ConflictingSchedule | null>(null)

  // Fetch speakers (non-archived only)
  const { data: speakers } = await useFetch("/api/speakers")
  const activeSpeakers = computed(() => speakers.value?.filter(s => !s.archived) || [])

  // Fetch publishers (filter for those who can deliver public talks)
  const { data: publishers } = await useFetch("/api/publishers")
  const activePublishers = computed(
    () => publishers.value?.filter(p => p.deliversPublicTalks) || []
  )

  // Fetch public talks
  const { data: publicTalks } = await useFetch("/api/public-talks")

  const speakerItems = computed(
    () =>
      activeSpeakers.value.map(s => ({
        label: `${s.firstName} ${s.lastName} (${s.congregationName})`,
        value: s.id,
      })) || []
  )

  const publisherItems = computed(
    () =>
      activePublishers.value.map(p => ({
        label: `${p.firstName} ${p.lastName}`,
        value: p.id,
      })) || []
  )

  const talkItems = computed(
    () =>
      publicTalks.value?.map(t => ({
        label: `${t.no} - ${t.title}`,
        value: t.id,
      })) || []
  )

  const sourceTypeItems = [
    { label: t("meetings.visitingSpeaker"), value: SPEAKER_SOURCE_TYPES.VISITING_SPEAKER },
    { label: t("meetings.localPublisher"), value: SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER },
  ]

  const isEditMode = computed(() => !!props.schedule)

  const formState = ref(createDefaultScheduleFormState())

  // Watch for modal opening - populate form based on mode
  watch(isOpen, open => {
    if (open) {
      if (props.schedule) {
        // Edit mode: populate form with existing schedule data
        formState.value = {
          date: props.schedule.date,
          meetingProgramId: props.schedule.meetingProgramId,
          partId: props.schedule.partId,
          speakerSourceType: props.schedule.speakerSourceType as SpeakerSourceType,
          speakerId: props.schedule.speakerId || "",
          publisherId: props.schedule.publisherId || "",
          talkId: props.schedule.talkId || undefined,
          customTalkTitle: props.schedule.customTalkTitle || "",
          overrideValidation: props.schedule.overrideValidation,
        }
      } else if (props.date) {
        // Create mode: use default state with selected date
        formState.value = createDefaultScheduleFormState(props.date)
      }
    }
  })

  // Watch for source type changes and clear opposite field
  watch(
    () => formState.value.speakerSourceType,
    newType => {
      if (newType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER) {
        formState.value.publisherId = ""
      } else if (newType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER) {
        formState.value.speakerId = ""
      }
    }
  )

  const schema = computed(() => createScheduleSchema(t))

  const modalTitle = computed(() => {
    if (!props.date) return t("meetings.modal.title")
    const action = isEditMode.value ? t("meetings.modal.editTitle") : t("meetings.modal.title")
    return `${action} - ${formatDatePL(props.date)}`
  })

  const overrideTargetId = ref<string | null>(null)

  function buildRequestBody(overrideValidation: boolean = formState.value.overrideValidation) {
    return {
      date: formState.value.date,
      meetingProgramId: formState.value.meetingProgramId,
      partId: formState.value.partId,
      speakerSourceType: formState.value.speakerSourceType,
      speakerId: formState.value.speakerId || undefined,
      publisherId: formState.value.publisherId || undefined,
      talkId: formState.value.talkId || undefined,
      customTalkTitle: formState.value.customTalkTitle?.trim() || undefined,
      overrideValidation,
    }
  }

  async function submitSchedule(opts: { targetId?: string; overrideValidation?: boolean } = {}) {
    const body = buildRequestBody(opts.overrideValidation)
    const targetId =
      opts.targetId ?? (isEditMode.value && props.schedule ? props.schedule.id : null)

    if (targetId) {
      await $fetch(`/api/schedules/${targetId}`, { method: "PATCH", body })
      toast.add({ title: t("meetings.messages.scheduleUpdated"), color: "success" })
    } else {
      await $fetch("/api/schedules", { method: "POST", body })
      toast.add({ title: t("meetings.messages.scheduleCreated"), color: "success" })
    }

    emit("saved")
    isOpen.value = false
  }

  function handleScheduleError(
    error: unknown,
    opts: { allowConflictModal?: boolean; pendingOverrideTargetId?: string | null } = {}
  ) {
    const { allowConflictModal = true, pendingOverrideTargetId = null } = opts

    if (allowConflictModal && isApiValidationError(error) && error.data.statusCode === 409) {
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

    if (
      isApiValidationError(error) &&
      error.data.data.message === "errors.speakerDoesntHaveTalk"
    ) {
      overrideTargetId.value = pendingOverrideTargetId
      showOverrideWarning.value = true
      return
    }

    if (isApiZodValidationError(error)) {
      const firstError = error.data.data.errors[0]
      toast.add({
        title: t("common.error"),
        description: t(firstError?.messageKey ?? "errors.unexpectedError"),
        color: "error",
      })
      return
    }

    if (isApiValidationError(error)) {
      toast.add({
        title: t("common.error"),
        description: t(error.data.data.message),
        color: "error",
      })
      return
    }

    const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")
    toast.add({
      title: t("common.error"),
      description: errorMessage,
      color: "error",
    })
  }

  const onSubmit = async () => {
    isSubmitting.value = true

    try {
      await submitSchedule()
    } catch (error: unknown) {
      handleScheduleError(error, {
        pendingOverrideTargetId:
          isEditMode.value && props.schedule ? props.schedule.id : null,
      })
    } finally {
      isSubmitting.value = false
    }
  }

  const handleOverrideConfirm = async () => {
    formState.value.overrideValidation = true
    showOverrideWarning.value = false

    const targetId = overrideTargetId.value ?? undefined

    try {
      await submitSchedule({ targetId, overrideValidation: true })
    } catch (error: unknown) {
      handleScheduleError(error, {
        allowConflictModal: false,
        pendingOverrideTargetId: targetId ?? null,
      })
    } finally {
      overrideTargetId.value = null
    }
  }

  async function handleOverwriteSchedule() {
    if (!conflictingSchedule.value) return
    const targetId = conflictingSchedule.value.id

    try {
      await submitSchedule({ targetId })
    } catch (error: unknown) {
      handleScheduleError(error, {
        allowConflictModal: false,
        pendingOverrideTargetId: targetId,
      })
    }
  }

  const useTalkOrCustomTitle = computed(() => {
    return formState.value.talkId || formState.value.customTalkTitle?.trim()
  })
</script>

<template>
  <UModal
    v-model:open="isOpen"
    data-testid="schedule-modal"
    :ui="{ footer: 'justify-between' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ modalTitle }}</h3>
    </template>

    <template #body>
      <UForm
        id="schedule-form"
        data-testid="schedule-form"
        :schema="schema"
        :state="formState">
        <div class="space-y-4">
          <UFormField
            name="speakerSourceType"
            :label="t('meetings.speakerSourceType')"
            required>
            <USelectMenu
              v-model="formState.speakerSourceType"
              data-testid="speaker-source-type-select"
              :items="sourceTypeItems"
              value-key="value"
              class="w-full" />
          </UFormField>

          <UFormField
            v-if="formState.speakerSourceType === SPEAKER_SOURCE_TYPES.VISITING_SPEAKER"
            name="speakerId"
            :label="t('meetings.visitingSpeaker')"
            required>
            <USelectMenu
              v-model="formState.speakerId"
              data-testid="speaker-select"
              :items="speakerItems"
              value-key="value"
              class="w-full" />
          </UFormField>

          <UFormField
            v-if="formState.speakerSourceType === SPEAKER_SOURCE_TYPES.LOCAL_PUBLISHER"
            name="publisherId"
            :label="t('meetings.localPublisher')"
            required>
            <USelectMenu
              v-model="formState.publisherId"
              data-testid="publisher-select"
              :items="publisherItems"
              value-key="value"
              class="w-full" />
          </UFormField>

          <UFormField
            name="talkId"
            :label="t('meetings.talk')">
            <USelectMenu
              v-model="formState.talkId"
              data-testid="talk-select"
              :items="talkItems"
              value-key="value"
              :placeholder="t('meetings.selectTalk')"
              class="w-full" />
          </UFormField>

          <UFormField
            name="customTalkTitle"
            :label="t('meetings.customTalk')">
            <UInput
              v-model="formState.customTalkTitle"
              data-testid="custom-talk-input"
              :placeholder="t('meetings.customTalkPlaceholder')"
              class="w-full" />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton
        data-testid="schedule-cancel-button"
        color="neutral"
        variant="ghost"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        data-testid="submit-schedule"
        type="submit"
        form="schedule-form"
        :disabled="!useTalkOrCustomTitle"
        :loading="isSubmitting"
        @click="onSubmit">
        {{ t("meetings.schedule") }}
      </UButton>
    </template>
  </UModal>

  <!-- Validation Warning Dialog -->
  <UModal
    v-model:open="showOverrideWarning"
    :ui="{ footer: 'justify-between' }"
    data-testid="validation-warning-dialog">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t("meetings.validationWarning.title") }}</h3>
    </template>

    <template #body>
      <p class="text-sm text-default">
        {{ t("meetings.validationWarning.message") }}
      </p>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="ghost"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        data-testid="confirm-override-button"
        color="warning"
        @click="handleOverrideConfirm">
        {{ t("meetings.validationWarning.confirm") }}
      </UButton>
    </template>
  </UModal>

  <!-- Conflict Modal -->
  <ScheduleConflictModal
    v-model:open="showConflictModal"
    :conflict="conflictingSchedule"
    @overwrite="handleOverwriteSchedule" />
</template>
