<script setup lang="ts">
	import { createScheduleSchema } from "#shared/utils/schemas"

	interface Speaker {
		id: string
		firstName: string
		lastName: string
		congregationName: string
		archived: boolean
	}

	interface PublicTalk {
		id: number
		no: string
		title: string
	}

	interface Props {
		date: number | null
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

	// Fetch speakers (non-archived only)
	const { data: speakers } = await useFetch<Speaker[]>("/api/speakers")
	const activeSpeakers = computed(() => speakers.value?.filter(s => !s.archived) || [])

	// Fetch public talks
	const { data: publicTalks } = await useFetch<PublicTalk[]>("/api/public-talks")

	const speakerItems = computed(
		() =>
			activeSpeakers.value.map(s => ({
				label: `${s.firstName} ${s.lastName} (${s.congregationName})`,
				value: s.id,
			})) || []
	)

	const talkItems = computed(
		() =>
			publicTalks.value?.map(t => ({
				label: `${t.no} - ${t.title}`,
				value: t.id,
			})) || []
	)

	const formState = ref(createDefaultScheduleFormState())

	// Watch for date changes
	watch(
		() => props.date,
		newDate => {
			if (newDate && isOpen.value) {
				formState.value.date = newDate
			}
		},
		{ immediate: true }
	)

	watch(isOpen, open => {
		if (open && props.date) {
			formState.value = createDefaultScheduleFormState(props.date)
		}
	})

	const schema = computed(() => createScheduleSchema(t))

	const modalTitle = computed(() => {
		if (!props.date) return t("meetings.modal.title")
		return `${t("meetings.modal.title")} - ${formatDatePL(props.date)}`
	})

	const onSubmit = async () => {
		isSubmitting.value = true

		try {
			await $fetch("/api/schedules", {
				method: "POST",
				body: {
					...formState.value,
					talkId: formState.value.talkId || undefined,
					customTalkTitle: formState.value.customTalkTitle?.trim() || undefined,
				},
			})

			toast.add({
				title: t("meetings.messages.scheduleCreated"),
				color: "success",
			})

			emit("saved")
			isOpen.value = false
		} catch (error: unknown) {
		// Check if it's a validation error (speaker doesn't have talk)
		if (isApiValidationError(error) && error.data.message === "errors.speakerDoesntHaveTalk") {
			showOverrideWarning.value = true
			} else {
				const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

				toast.add({
					title: t("common.error"),
					description: errorMessage,
					color: "error",
				})
			}
		} finally {
			isSubmitting.value = false
		}
	}

	const handleOverrideConfirm = async () => {
		formState.value.overrideValidation = true
		showOverrideWarning.value = false

		// Re-submit with override
		try {
			await $fetch("/api/schedules", {
				method: "POST",
				body: {
					...formState.value,
					talkId: formState.value.talkId || undefined,
					customTalkTitle: formState.value.customTalkTitle?.trim() || undefined,
				},
			})

			toast.add({
				title: t("meetings.messages.scheduleCreated"),
				color: "success",
			})

			emit("saved")
			isOpen.value = false
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : t("errors.unexpectedError")

			toast.add({
				title: t("common.error"),
				description: errorMessage,
				color: "error",
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
						name="speakerId"
						:label="t('meetings.speaker')"
						required>
						<USelect
							v-model="formState.speakerId"
							data-testid="speaker-select"
							:items="speakerItems"
							value-key="value"
							class="w-full" />
					</UFormField>

					<UFormField
						name="talkId"
						:label="t('meetings.talk')">
						<USelect
							v-model="formState.talkId"
							data-testid="talk-select"
							:items="talkItems"
							value-key="value"
							class="w-full">
							<template #default>
								<span v-if="formState.talkId" class="truncate">
									{{
										talkItems.find(t => t.value === formState.talkId)?.label ||
										t("meetings.selectTalk")
									}}
								</span>
								<span v-else class="text-muted truncate">
									{{ t("meetings.selectTalk") }}
								</span>
							</template>
						</USelect>
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

					<UFormField
						name="isCircuitOverseerVisit"
						:label="t('meetings.circuitOverseerVisit')">
						<UCheckbox
							v-model="formState.isCircuitOverseerVisit"
							data-testid="circuit-overseer-toggle"
							:label="t('meetings.circuitOverseerVisit')" />
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
</template>
