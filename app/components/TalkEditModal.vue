<script setup lang="ts">
  import type { FormSubmitEvent } from "#ui/types"
  import { createTalkSchema, createTalkEditSchema } from "../schemas/talk"
  import type { TalkInput, TalkEditInput } from "../schemas/talk"

  interface PublicTalk {
    id: number
    no: string
    title: string
    multimediaCount: number
    videoCount: number
    status: "circuit_overseer" | "will_be_replaced" | null
    createdAt: Date
  }

  interface Props {
    talk: PublicTalk | null
    mode: "add" | "edit"
  }

  const props = defineProps<Props>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const emit = defineEmits<{
    saved: [talk: PublicTalk]
  }>()

  const { t } = useI18n()
  const toast = useToast()

  const isSubmitting = ref(false)

  const initialFormState = computed(() => {
    if (props.mode === "edit" && props.talk) {
      return {
        title: props.talk.title,
        multimediaCount: props.talk.multimediaCount,
        videoCount: props.talk.videoCount,
      }
    }

    return {
      no: "",
      title: "",
      multimediaCount: 0,
      videoCount: 0,
    }
  })

  const formState = ref({ ...initialFormState.value })

  watch(
    () => props.talk,
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

  const schema = computed(() => (props.mode === "add" ? createTalkSchema(t) : createTalkEditSchema(t)))

  const modalTitle = computed(() =>
    props.mode === "add" ? t("publicTalks.modal.addTitle") : t("publicTalks.modal.editTitle")
  )

  const submitButtonText = computed(() =>
    props.mode === "add" ? t("publicTalks.modal.add") : t("publicTalks.modal.save")
  )

  const onSubmit = async (event: FormSubmitEvent<TalkInput | TalkEditInput>) => {
    isSubmitting.value = true

    try {
      if (props.mode === "add") {
        await handleAdd(event.data as TalkInput)
      } else {
        await handleEdit(event.data as TalkEditInput)
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

  const handleAdd = async (data: TalkInput) => {
    const response = await $fetch<{ success: boolean; talk: PublicTalk }>("/api/public-talks", {
      method: "POST",
      body: data,
    })

    if (response.success && response.talk) {
      emit("saved", response.talk)
      isOpen.value = false
      toast.add({
        title: t("publicTalks.messages.talkCreated"),
        color: "success",
      })
    }
  }

  const handleEdit = async (data: TalkEditInput) => {
    if (!props.talk) {
      return
    }

    const response = await $fetch<{ success: boolean; talk: PublicTalk }>(
      `/api/public-talks/${props.talk.id}`,
      {
        method: "PATCH",
        body: data,
      }
    )

    if (response.success && response.talk) {
      emit("saved", response.talk)
      isOpen.value = false
      toast.add({
        title: t("publicTalks.messages.talkUpdated"),
        color: "success",
      })
    }
  }
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard class="max-w-2xl">
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">
            {{ modalTitle }}
          </h3>
        </template>

        <UForm
          id="talk-form"
          data-testid="talk-form"
          :schema="schema"
          :state="formState"
          class="space-y-4"
          @submit="onSubmit">
          <UFormField
            v-if="mode === 'add'"
            :label="t('publicTalks.modal.talkNumber')"
            name="no"
            required>
            <UInput
              v-model="formState.no"
              data-testid="talk-no-input"
              :placeholder="t('publicTalks.modal.talkNumber')"
              :disabled="isSubmitting"
              class="w-full" />
          </UFormField>

          <UFormField
            v-if="mode === 'edit' && talk"
            :label="t('publicTalks.modal.talkNumber')">
            <UInput
              :model-value="talk.no"
              :disabled="true"
              class="w-full" />
          </UFormField>

          <UFormField
            :label="t('publicTalks.modal.talkTitle')"
            name="title"
            required>
            <UInput
              v-model="formState.title"
              data-testid="talk-title-input"
              :placeholder="t('publicTalks.modal.talkTitle')"
              :disabled="isSubmitting"
              class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              :label="t('publicTalks.modal.multimediaCount')"
              name="multimediaCount"
              required>
              <UInput
                v-model.number="formState.multimediaCount"
                data-testid="talk-multimedia-input"
                type="number"
                min="0"
                max="50"
                :disabled="isSubmitting"
                class="w-full" />
            </UFormField>

            <UFormField
              :label="t('publicTalks.modal.videoCount')"
              name="videoCount"
              required>
              <UInput
                v-model.number="formState.videoCount"
                data-testid="talk-video-input"
                type="number"
                min="0"
                max="20"
                :disabled="isSubmitting"
                class="w-full" />
            </UFormField>
          </div>
        </UForm>

        <template #footer>
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <UButton
              type="button"
              data-testid="talk-cancel-button"
              variant="outline"
              color="neutral"
              :disabled="isSubmitting"
              class="w-full sm:w-auto"
              @click="isOpen = false">
              {{ t("publicTalks.modal.cancel") }}
            </UButton>
            <UButton
              type="submit"
              data-testid="talk-save-button"
              form="talk-form"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="w-full sm:w-auto">
              {{ submitButtonText }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
