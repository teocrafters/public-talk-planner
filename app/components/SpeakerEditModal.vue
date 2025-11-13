<script setup lang="ts">
	import type { FormSubmitEvent } from "#ui/types"
	import { createSpeakerSchema, editSpeakerSchema } from "#shared/utils/schemas"
	import type { SpeakerInput, SpeakerEditInput } from "#shared/utils/schemas"

	interface Speaker {
		id: string
		firstName: string
		lastName: string
		phone: string
		congregationId: string
		congregationName: string
		archived: boolean
		archivedAt: Date | null
		createdAt: Date
		updatedAt: Date
		talks: Array<{
			id: number
			no: string
			title: string
		}>
	}

	interface Congregation {
		id: string
		name: string
	}

	interface PublicTalk {
		id: number
		no: string
		title: string
	}

	interface Props {
		speaker: Speaker | null
		mode: "add" | "edit"
	}

	const props = defineProps<Props>()

	const isOpen = defineModel<boolean>("open", { required: true })

	const emit = defineEmits<{
		saved: [speaker: Speaker]
	}>()

	const { t } = useI18n()
	const toast = useToast()

	const isSubmitting = ref(false)

	const { data: congregations } = await useFetch<Congregation[]>("/api/congregations")
	const { data: publicTalks } = await useFetch<PublicTalk[]>("/api/public-talks")

	const congregationItems = computed(
		() =>
			congregations.value?.map((c) => ({
				label: c.name,
				value: c.id,
			})) || [],
	)

	const talkItems = computed(
		() =>
			publicTalks.value?.map((t) => ({
				label: `${t.no} - ${t.title}`,
				value: t.id,
			})) || [],
	)

	const selectedTalkNumbers = computed(() => {
		if (!formState.value.talkIds || formState.value.talkIds.length === 0) {
			return ""
		}

		return formState.value.talkIds
			.map((id) => publicTalks.value?.find((t) => t.id === id)?.no)
			.filter(Boolean)
			.join(", ")
	})

	const initialFormState = computed(() => {
		if (props.mode === "edit" && props.speaker) {
			return {
				firstName: props.speaker.firstName,
				lastName: props.speaker.lastName,
				phone: formatPhoneNumber(props.speaker.phone),
				congregationId: props.speaker.congregationId,
				talkIds: props.speaker.talks.map((t) => t.id),
			}
		}

		return {
			firstName: "",
			lastName: "",
			phone: "",
			congregationId: "",
			talkIds: [] as number[],
		}
	})

	const formState = ref({ ...initialFormState.value })

	watch(
		() => props.speaker,
		() => {
			formState.value = { ...initialFormState.value }
		},
		{ immediate: true },
	)

	watch(isOpen, (open) => {
		if (open) {
			formState.value = { ...initialFormState.value }
		}
	})

	const schema = computed(() =>
		props.mode === "add" ? createSpeakerSchema(t) : editSpeakerSchema(t),
	)

	const modalTitle = computed(() =>
		props.mode === "add" ? t("speakers.modal.addTitle") : t("speakers.modal.editTitle"),
	)

	const submitButtonText = computed(() =>
		props.mode === "add" ? t("speakers.modal.save") : t("speakers.modal.save"),
	)

	const onSubmit = async (event: FormSubmitEvent<SpeakerInput | SpeakerEditInput>) => {
		isSubmitting.value = true

		try {
			const submitData = {
				...event.data,
				phone: unformatPhoneNumber(event.data.phone!),
			}

			if (props.mode === "add") {
				await handleAdd(submitData as SpeakerInput)
			} else {
				await handleEdit(submitData as SpeakerEditInput)
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

	const handleAdd = async (data: SpeakerInput) => {
		const response = await $fetch<{ success: boolean; speaker: Speaker }>("/api/speakers", {
			method: "POST",
			body: data,
		})

		toast.add({
			title: t("speakers.messages.speakerCreated"),
			color: "success",
		})

		emit("saved", response.speaker)
		isOpen.value = false
	}

	const handleEdit = async (data: SpeakerEditInput) => {
		if (!props.speaker?.id) return

		const response = await $fetch<{ success: boolean; speaker: Speaker }>(
			`/api/speakers/${props.speaker.id}`,
			{
				method: "PATCH",
				body: data,
			},
		)

		toast.add({
			title: t("speakers.messages.speakerUpdated"),
			color: "success",
		})

		emit("saved", response.speaker)
		isOpen.value = false
	}
</script>

<template>
	<UModal v-model:open="isOpen" :ui="{ footer: 'justify-between' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ modalTitle }}</h3>
    </template>

		<template #body>
			<UForm
        id="speaker-form"
        data-testid="speaker-form"
        :schema="schema"
        :state="formState"
        @submit="onSubmit">
        <div class="space-y-4">
          <UFormField
            name="firstName"
            :label="t('speakers.modal.firstName')"
            required>
            <UInput
              v-model="formState.firstName"
              data-testid="speaker-firstname-input"
              class="w-full" />
          </UFormField>

          <UFormField
            name="lastName"
            :label="t('speakers.modal.lastName')"
            required>
            <UInput
              v-model="formState.lastName"
              data-testid="speaker-lastname-input"
              class="w-full" />
          </UFormField>

          <UFormField
            name="phone"
            :label="t('speakers.modal.phone')"
            required>
            <UInput
              v-model="formState.phone"
              data-testid="speaker-phone-input"
              placeholder="123-456-789"
              class="w-full" />
          </UFormField>

          <UFormField
            name="congregationId"
            :label="t('speakers.modal.congregation')"
            required>
            <USelect
              v-model="formState.congregationId"
              data-testid="speaker-congregation-select"
              :items="congregationItems"
              value-key="value"
              class="w-full" />
          </UFormField>

          <UFormField name="talkIds" :label="t('speakers.modal.talks')">
            <USelect
              v-model="formState.talkIds"
              data-testid="speaker-talks-select"
              :items="talkItems"
              value-key="value"
              class="w-full"
              multiple>
              <template #default>
                <span v-if="selectedTalkNumbers" class="truncate">
                  {{ selectedTalkNumbers }}
                </span>
                <span v-else class="text-muted truncate">
                  {{ t('speakers.modal.selectTalks') }}
                </span>
              </template>
            </USelect>
          </UFormField>
        </div>
      </UForm>
		</template>
    <template #footer="{ close }">
      <UButton
        data-testid="speaker-cancel-button"
        color="neutral"
        variant="ghost"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <UButton
        data-testid="speaker-save-button"
        type="submit"
        form="speaker-form"
        :loading="isSubmitting">
        {{ submitButtonText }}
      </UButton>
    </template>
	</UModal>
</template>
