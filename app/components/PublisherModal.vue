<script setup lang="ts">
  import type { FormSubmitEvent } from "#ui/types"
  import { createPublisherSchema, updatePublisherSchema } from "#shared/utils/schemas"
  import type { PublisherInput, PublisherUpdateInput } from "#shared/utils/schemas"

  interface Publisher {
    id: string
    firstName: string
    lastName: string
    userId: string | null
    isElder: boolean
    isMinisterialServant: boolean
    isRegularPioneer: boolean
    canChairWeekendMeeting: boolean
    conductsWatchtowerStudy: boolean
    backupWatchtowerConductor: boolean
    isReader: boolean
    offersPublicPrayer: boolean
    deliversPublicTalks: boolean
    isCircuitOverseer: boolean
    createdAt: Date
    updatedAt: Date
  }

  interface Props {
    publisher: Publisher | null
    mode: "add" | "edit"
  }

  const props = defineProps<Props>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const emit = defineEmits<{
    saved: [publisher: Publisher]
  }>()

  const { t } = useI18n()
  const toast = useToast()

  const isSubmitting = ref(false)

  const initialFormState = computed(() => {
    if (props.mode === "edit" && props.publisher) {
      return {
        firstName: props.publisher.firstName,
        lastName: props.publisher.lastName,
        isElder: props.publisher.isElder,
        isMinisterialServant: props.publisher.isMinisterialServant,
        isRegularPioneer: props.publisher.isRegularPioneer,
        canChairWeekendMeeting: props.publisher.canChairWeekendMeeting,
        conductsWatchtowerStudy: props.publisher.conductsWatchtowerStudy,
        backupWatchtowerConductor: props.publisher.backupWatchtowerConductor,
        isReader: props.publisher.isReader,
        offersPublicPrayer: props.publisher.offersPublicPrayer,
        deliversPublicTalks: props.publisher.deliversPublicTalks,
        isCircuitOverseer: props.publisher.isCircuitOverseer,
      }
    }

    return {
      firstName: "",
      lastName: "",
      isElder: false,
      isMinisterialServant: false,
      isRegularPioneer: false,
      canChairWeekendMeeting: false,
      conductsWatchtowerStudy: false,
      backupWatchtowerConductor: false,
      isReader: false,
      offersPublicPrayer: false,
      deliversPublicTalks: false,
      isCircuitOverseer: false,
    }
  })

  const formState = ref({ ...initialFormState.value })

  watch(
    () => props.publisher,
    () => {
      formState.value = { ...initialFormState.value }
    },
    { immediate: true }
  )

  watch(isOpen, open => {
    if (open) {
      formState.value = { ...initialFormState.value }
    }
  })

  const schema = computed(() =>
    props.mode === "add" ? createPublisherSchema(t) : updatePublisherSchema(t)
  )

  const modalTitle = computed(() =>
    props.mode === "add" ? t("publishers.modal.addTitle") : t("publishers.modal.editTitle")
  )

  const submitButtonText = computed(() => t("publishers.modal.save"))

  const onSubmit = async (event: FormSubmitEvent<PublisherInput | PublisherUpdateInput>) => {
    isSubmitting.value = true

    try {
      if (props.mode === "add") {
        await handleAdd(event.data as PublisherInput)
      } else {
        await handleEdit(event.data as PublisherUpdateInput)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

      toast.add({
        title: t("common.error"),
        description: errorMessage,
        color: "error",
      })
    } finally {
      isSubmitting.value = false
    }
  }

  const handleAdd = async (data: PublisherInput) => {
    const response = await $fetch<{ success: boolean; publisher: Publisher }>("/api/publishers", {
      method: "POST",
      body: data,
    })

    toast.add({
      title: t("publishers.messages.publisherCreated"),
      color: "success",
    })

    emit("saved", response.publisher)
    isOpen.value = false
  }

  const handleEdit = async (data: PublisherUpdateInput) => {
    if (!props.publisher?.id) return

    const response = await $fetch<{ success: boolean; publisher: Publisher }>(
      `/api/publishers/${props.publisher.id}`,
      {
        method: "PATCH",
        body: data,
      }
    )

    toast.add({
      title: t("publishers.messages.publisherUpdated"),
      color: "success",
    })

    emit("saved", response.publisher)
    isOpen.value = false
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ footer: 'justify-between' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ modalTitle }}</h3>
    </template>

    <template #body>
      <UForm
        id="publisher-form"
        data-testid="publisher-form"
        :schema="schema"
        :state="formState"
        @submit="onSubmit">
        <div class="space-y-4">
          <UFormField
            name="firstName"
            :label="t('publishers.modal.firstName')"
            required>
            <UInput
              v-model="formState.firstName"
              data-testid="publisher-firstname-input"
              class="w-full" />
          </UFormField>

          <UFormField
            name="lastName"
            :label="t('publishers.modal.lastName')"
            required>
            <UInput
              v-model="formState.lastName"
              data-testid="publisher-lastname-input"
              class="w-full" />
          </UFormField>

          <div class="border-t border-default pt-4">
            <p class="text-sm font-medium text-default mb-3">
              {{ t("publishers.modal.capabilities") }}
            </p>

            <div class="space-y-2">
              <UCheckbox
                v-model="formState.isElder"
                data-testid="publisher-elder-checkbox"
                :label="t('publishers.capabilities.elder')" />

              <UCheckbox
                v-model="formState.isMinisterialServant"
                data-testid="publisher-ministerial-servant-checkbox"
                :label="t('publishers.capabilities.ministerialServant')" />

              <UCheckbox
                v-model="formState.isCircuitOverseer"
                data-testid="publisher-circuit-overseer-checkbox"
                :label="t('publishers.capabilities.circuitOverseer')" />

              <UCheckbox
                v-model="formState.isRegularPioneer"
                data-testid="publisher-regular-pioneer-checkbox"
                :label="t('publishers.capabilities.regularPioneer')" />

              <UCheckbox
                v-model="formState.canChairWeekendMeeting"
                data-testid="publisher-chairman-checkbox"
                :label="t('publishers.capabilities.canChairWeekendMeeting')" />

              <UCheckbox
                v-model="formState.conductsWatchtowerStudy"
                data-testid="publisher-watchtower-conductor-checkbox"
                :label="t('publishers.capabilities.conductsWatchtowerStudy')" />

              <UCheckbox
                v-model="formState.backupWatchtowerConductor"
                data-testid="publisher-backup-watchtower-checkbox"
                :label="t('publishers.capabilities.backupWatchtowerConductor')" />

              <UCheckbox
                v-model="formState.isReader"
                data-testid="publisher-reader-checkbox"
                :label="t('publishers.capabilities.reader')" />

              <UCheckbox
                v-model="formState.offersPublicPrayer"
                data-testid="publisher-prayer-checkbox"
                :label="t('publishers.capabilities.offersPublicPrayer')" />

              <UCheckbox
                v-model="formState.deliversPublicTalks"
                data-testid="publisher-public-talks-checkbox"
                :label="t('publishers.capabilities.deliversPublicTalks')" />
            </div>
          </div>
        </div>
      </UForm>
    </template>
    <template #footer="{ close }">
      <UButton
        data-testid="publisher-cancel-button"
        color="neutral"
        variant="ghost"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        data-testid="publisher-save-button"
        type="submit"
        form="publisher-form"
        :loading="isSubmitting">
        {{ submitButtonText }}
      </UButton>
    </template>
  </UModal>
</template>
