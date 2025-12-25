<script setup lang="ts">
  import {
    createDefaultWeekendMeetingFormState,
    buildStateFromProgram,
  } from "~/utils/weekend-meeting-form"

  interface Publisher {
    id: string
    firstName: string
    lastName: string
    isElder: boolean
    isMinisterialServant: boolean
    canChairWeekendMeeting: boolean
    conductsWatchtowerStudy: boolean
    backupWatchtowerConductor: boolean
    isReader: boolean
    offersPublicPrayer: boolean
    isCircuitOverseer: boolean
  }

  interface AvailablePublishers {
    chairman: Publisher[]
    watchtowerStudy: Publisher[]
    reader: Publisher[]
    prayer: Publisher[]
    circuitOverseerTalk: Publisher[]
  }

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

  interface Props {
    date: number | null
    program?: WeekendProgram | null
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    saved: []
  }>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const { t } = useI18n()
  const toast = useToast()

  // Form state
  const state = ref(createDefaultWeekendMeetingFormState())

  // Fetch available publishers
  const { data: availablePublishers, pending: loadingPublishers } =
    await useFetch<AvailablePublishers>("/api/publishers/available-for-parts")

  // Publisher options for selects
  const chairmanOptions = computed(() =>
    (availablePublishers.value?.chairman || []).map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    }))
  )

  const watchtowerOptions = computed(() =>
    (availablePublishers.value?.watchtowerStudy || []).map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    }))
  )

  const readerOptions = computed(() =>
    (availablePublishers.value?.reader || []).map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    }))
  )

  const prayerOptions = computed(() =>
    (availablePublishers.value?.prayer || []).map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    }))
  )

  const circuitOverseerOptions = computed(() =>
    (availablePublishers.value?.circuitOverseerTalk || []).map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName}`,
    }))
  )

  // Form instance ref
  const form = useTemplateRef("form")
  const isLoading = ref(false)

  const isEditMode = computed(() => !!props.program)

  // Formatted date for display
  const formattedDate = computed(() => {
    if (!props.date) return ""
    return formatDatePL(props.date)
  })

  // Watch for modal opening - populate form based on mode
  watch(isOpen, open => {
    if (open) {
      if (props.program) {
        // Edit mode: populate form with existing program data
        state.value = buildStateFromProgram(props.program)
      } else {
        // Create mode: reset form to default state
        state.value = createDefaultWeekendMeetingFormState()
      }
    }
  })

  async function onSubmit() {
    if (!props.date) return

    isLoading.value = true

    try {
      const requestBody: {
        date: number
        isCircuitOverseerVisit: boolean
        parts: {
          chairman: string
          watchtowerStudy: string
          reader?: string
          prayer?: string
          publicTalk?: { title: string }
          circuitOverseerTalk?: { publisherId: string; title: string }
        }
        overrideDuplicates: boolean
      } = {
        date: props.date,
        isCircuitOverseerVisit: state.value.isCircuitOverseerVisit,
        parts: {
          chairman: state.value.parts.chairman,
          watchtowerStudy: state.value.parts.watchtowerStudy,
        },
        overrideDuplicates: state.value.overrideDuplicates,
      }

      // Add optional reader
      if (state.value.parts.reader) {
        requestBody.parts.reader = state.value.parts.reader
      }

      // Add optional prayer
      if (state.value.parts.prayer) {
        requestBody.parts.prayer = state.value.parts.prayer
      }

      // Add public talk title if CO visit
      if (state.value.isCircuitOverseerVisit && state.value.parts.publicTalk.title) {
        requestBody.parts.publicTalk = {
          title: state.value.parts.publicTalk.title,
        }
      }

      // Add circuit overseer talk if CO visit
      if (
        state.value.isCircuitOverseerVisit &&
        state.value.parts.circuitOverseerTalk.publisherId &&
        state.value.parts.circuitOverseerTalk.title
      ) {
        requestBody.parts.circuitOverseerTalk = {
          publisherId: state.value.parts.circuitOverseerTalk.publisherId,
          title: state.value.parts.circuitOverseerTalk.title,
        }
      }

      if (isEditMode.value && props.program) {
        // Edit mode: PATCH request
        await $fetch(`/api/weekend-meetings/${props.program.id}`, {
          method: "PATCH",
          body: requestBody,
        })

        toast.add({
          title: t("common.success"),
          description: t("weekendMeetings.messages.meetingUpdated"),
          color: "success",
        })
      } else {
        // Create mode: POST request
        await $fetch("/api/weekend-meetings/plan", {
          method: "POST",
          body: requestBody,
        })

        toast.add({
          title: t("common.success"),
          description: t("weekendMeetings.messages.meetingPlanned"),
          color: "success",
        })
      }

      emit("saved")
      isOpen.value = false
    } catch (error: unknown) {
      if (isApiZodValidationError(error)) {
        // Handle Zod validation errors (multiple field errors)
        const firstError = error.data.data.errors[0]
        toast.add({
          title: t("common.error"),
          description: t(firstError?.messageKey || "errors.unexpectedError"),
          color: "error",
        })
      } else if (isApiValidationError(error)) {
        // Handle business logic errors (single error message)
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
    :ui="{ footer: 'justify-between' }">
    <UButton
      data-testid="open-weekend-planning-modal-button"
      :label="t('weekendMeetings.plan')" />

    <template #body>
      <UForm
        ref="form"
        data-testid="weekend-planning-form"
        :state="state"
        @submit="onSubmit">
        <div class="space-y-4">
          <div class="text-center mb-4">
            <h2
              data-testid="modal-title"
              class="text-2xl font-bold text-default">
              {{
                isEditMode
                  ? t("weekendMeetings.modal.editTitle")
                  : t("weekendMeetings.modal.planTitle")
              }}
            </h2>
            <p class="text-sm text-muted mt-1">{{ formattedDate }}</p>
          </div>

          <!-- Circuit Overseer Visit Checkbox -->
          <UFormField
            :label="t('weekendMeetings.modal.isCircuitOverseerVisit')"
            name="isCircuitOverseerVisit">
            <UCheckbox
              v-model="state.isCircuitOverseerVisit"
              data-testid="co-visit-checkbox"
              :label="t('weekendMeetings.modal.isCircuitOverseerVisit')" />
          </UFormField>

          <!-- Chairman -->
          <UFormField
            :label="t('weekendMeetings.chairman')"
            name="parts.chairman"
            required>
            <USelectMenu
              v-model="state.parts.chairman"
              class="w-full"
              data-testid="chairman-select"
              :items="chairmanOptions"
              :loading="loadingPublishers"
              :placeholder="t('weekendMeetings.chairman')"
              :search-input="{ placeholder: t('publishers.searchPlaceholder') }"
              value-key="value" />
          </UFormField>

          <!-- Circuit Overseer Visit Section (conditional) -->
          <div
            v-if="state.isCircuitOverseerVisit"
            data-testid="co-visit-section">
            <!-- 1. Circuit Overseer Selection -->
            <UFormField
              :label="t('weekendMeetings.circuitOverseer')"
              name="parts.circuitOverseerTalk.publisherId"
              required>
              <USelectMenu
                v-model="state.parts.circuitOverseerTalk.publisherId"
                class="w-full"
                data-testid="co-select"
                :items="circuitOverseerOptions"
                :loading="loadingPublishers"
                :placeholder="t('weekendMeetings.circuitOverseer')"
                :search-input="{ placeholder: t('publishers.searchPlaceholder') }"
                value-key="value" />
            </UFormField>

            <!-- 2. Public Talk Title -->
            <UFormField
              :label="t('weekendMeetings.publicTalkTitle')"
              name="parts.publicTalk.title"
              required>
              <UInput
                v-model="state.parts.publicTalk.title"
                class="w-full"
                data-testid="public-talk-title-input"
                :placeholder="t('weekendMeetings.publicTalkTitlePlaceholder')" />
            </UFormField>

            <!-- 3. Service Talk Title -->
            <UFormField
              :label="t('weekendMeetings.circuitOverseerTalkTitle')"
              name="parts.circuitOverseerTalk.title"
              required>
              <UInput
                v-model="state.parts.circuitOverseerTalk.title"
                class="w-full"
                data-testid="co-service-talk-title-input"
                :placeholder="t('weekendMeetings.circuitOverseerTalkTitlePlaceholder')" />
            </UFormField>
          </div>

          <!-- Watchtower Study -->
          <UFormField
            :label="t('weekendMeetings.watchtowerStudy')"
            name="parts.watchtowerStudy"
            required>
            <USelectMenu
              v-model="state.parts.watchtowerStudy"
              class="w-full"
              data-testid="watchtower-select"
              :items="watchtowerOptions"
              :loading="loadingPublishers"
              :placeholder="t('weekendMeetings.watchtowerStudy')"
              :search-input="{ placeholder: t('publishers.searchPlaceholder') }"
              value-key="value" />
          </UFormField>

          <!-- Reader (optional, hidden during Circuit Overseer visit) -->
          <UFormField
            v-if="!state.isCircuitOverseerVisit"
            :label="t('weekendMeetings.reader')"
            name="parts.reader">
            <USelectMenu
              v-model="state.parts.reader"
              class="w-full"
              data-testid="reader-select"
              :items="readerOptions"
              :loading="loadingPublishers"
              :placeholder="t('weekendMeetings.reader')"
              :search-input="{ placeholder: t('publishers.searchPlaceholder') }"
              value-key="value" />
          </UFormField>

          <!-- Prayer -->
          <UFormField
            :label="t('weekendMeetings.prayer')"
            name="parts.prayer">
            <USelectMenu
              v-model="state.parts.prayer"
              class="w-full"
              data-testid="prayer-select"
              :items="prayerOptions"
              :loading="loadingPublishers"
              :placeholder="t('weekendMeetings.prayer')"
              :search-input="{ placeholder: t('publishers.searchPlaceholder') }"
              value-key="value" />
          </UFormField>

          <!-- Override Duplicates -->
          <UFormField
            :label="t('weekendMeetings.modal.overrideDuplicates')"
            name="overrideDuplicates">
            <UCheckbox
              v-model="state.overrideDuplicates"
              data-testid="override-duplicates-checkbox"
              :label="t('weekendMeetings.modal.overrideDuplicates')" />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton
        data-testid="cancel-button"
        variant="outline"
        :label="t('common.cancel')"
        :disabled="isLoading"
        @click="close" />
      <UButton
        data-testid="save-button"
        type="submit"
        :label="t('weekendMeetings.modal.save')"
        :loading="isLoading"
        :disabled="isLoading || loadingPublishers"
        @click="form?.submit()" />
    </template>
  </UModal>
</template>
