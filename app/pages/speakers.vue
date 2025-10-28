<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-default">
					{{ t("speakers.title") }}
				</h1>
				<p class="mt-2 text-sm text-muted">
					{{ t("speakers.totalSpeakers", { count: speakers?.length || 0 }) }}
				</p>
			</div>
			<UButton
				v-if="canManageSpeakers"
				data-testid="add-speaker-button"
				icon="i-heroicons-plus"
				size="md"
				class="w-full sm:w-auto"
				@click="handleAddSpeaker">
				{{ t("speakers.actions.add") }}
			</UButton>
		</div>

		<div class="flex flex-col sm:flex-row gap-4">
			<UInput
				v-model="searchQuery"
				data-testid="search-input"
				:placeholder="t('speakers.searchPlaceholder')"
				icon="i-heroicons-magnifying-glass"
				class="flex-1" />

			<UCheckbox
				v-model="showArchived"
				data-testid="show-archived-toggle"
				:label="t('speakers.showArchived')" />
		</div>

		<div v-if="pending" class="space-y-4">
			<USkeleton v-for="i in 5" :key="i" class="h-32 w-full" />
		</div>

		<UAlert
			v-else-if="error"
			color="error"
			:title="t('common.error')"
			:description="error.message" />

		<div v-else-if="filteredSpeakers.length > 0" class="space-y-3">
			<UCard
				v-for="speaker in filteredSpeakers"
				:key="speaker.id"
				data-testid="speaker-card"
				:class="{
					'opacity-60': speaker.archived,
					'hover:shadow-md transition-shadow': true,
				}">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-2">
							<h3 class="text-lg font-medium text-default">
								{{ speaker.firstName }} {{ speaker.lastName }}
							</h3>
							<UBadge v-if="speaker.archived" color="neutral" variant="subtle">
								{{ t("speakers.archived") }}
							</UBadge>
						</div>
						<p class="text-sm text-muted">{{ speaker.congregationName }}</p>
						<p class="text-sm text-muted">
							{{ formatPhoneNumber(speaker.phone) }}
						</p>
						<div v-if="speaker.talks.length > 0" class="mt-2">
							<p class="text-xs text-dimmed mb-1">{{ t("speakers.talks") }}:</p>
							<div class="flex flex-wrap gap-2" data-testid="speaker-talks-badges">
								<UBadge
									v-for="talk in speaker.talks"
									:key="talk.id"
									color="primary"
									variant="subtle"
									size="xs">
									{{ talk.no }}
								</UBadge>
							</div>
						</div>
					</div>

					<UDropdownMenu
						v-if="canManageSpeakers"
						:items="getSpeakerActions(speaker)">
						<UButton
							icon="i-heroicons-ellipsis-vertical"
							color="neutral"
							variant="ghost"
							size="sm"
							data-testid="speaker-actions-menu" />
					</UDropdownMenu>
				</div>
			</UCard>
		</div>

		<UAlert
			v-else
			data-testid="no-results-alert"
			color="info"
			:title="t('speakers.noResults')"
			icon="i-heroicons-information-circle" />

		<SpeakerEditModal
			v-model:open="editModalOpen"
			:speaker="selectedSpeaker"
			:mode="editMode"
			@saved="handleSpeakerSaved" />
	</div>
</template>

<script setup lang="ts">
	import type { DropdownMenuItem } from "@nuxt/ui"

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

	definePageMeta({
    auth: {
      only: "user",
      redirectGuestTo: "/",
    },
    layout: "authenticated",
  })

	const { t } = useI18n()
	const { can, fetchPermissions } = usePermissions()
	const toast = useToast()

	const canManageSpeakers = computed(
		() => can("speakers", "create").value || can("speakers", "update").value || can("speakers", "archive").value,
	)

	const searchQuery = ref("")
	const showArchived = ref(false)
	const editModalOpen = ref(false)
	const selectedSpeaker = ref<Speaker | null>(null)
	const editMode = ref<"add" | "edit">("add")

	const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

	const filteredSpeakers = computed(() => {
		if (!speakers.value) return []

		let filtered = speakers.value

		if (!showArchived.value) {
			filtered = filtered.filter((s) => !s.archived)
		}

		if (searchQuery.value) {
			const query = searchQuery.value.toLowerCase()
			filtered = filtered.filter(
				(s) =>
					s.firstName.toLowerCase().includes(query) ||
					s.lastName.toLowerCase().includes(query) ||
					formatPhoneNumber(s.phone).includes(query) ||
					s.congregationName.toLowerCase().includes(query),
			)
		}

		return filtered
	})

	const getSpeakerActions = (speaker: Speaker): DropdownMenuItem[] => {
		return [
			{
				label: t("speakers.actions.edit"),
				icon: "i-heroicons-pencil",
				onSelect: () => handleEdit(speaker),
			},
			{
				type: "separator",
			},
			{
				label: speaker.archived ? t("speakers.actions.restore") : t("speakers.actions.archive"),
				icon: speaker.archived ? "i-heroicons-arrow-path" : "i-heroicons-archive-box",
				onSelect: () => handleArchive(speaker),
			},
		]
	}

	const handleAddSpeaker = () => {
		selectedSpeaker.value = null
		editMode.value = "add"
		editModalOpen.value = true
	}

	const handleEdit = (speaker: Speaker) => {
		selectedSpeaker.value = speaker
		editMode.value = "edit"
		editModalOpen.value = true
	}

	const handleArchive = async (speaker: Speaker) => {
		try {
			await $fetch(`/api/speakers/${speaker.id}/archive`, {
				method: "PATCH",
				body: { archived: !speaker.archived },
			})

			toast.add({
				title: t(
					speaker.archived ? "speakers.messages.speakerRestored" : "speakers.messages.speakerArchived",
				),
				color: "success",
			})

			await refresh()
		} catch (err: unknown) {
			toast.add({
				title: t("common.error"),
				description: err instanceof Error ? err.message : t("speakers.messages.archiveError"),
				color: "error",
			})
		}
	}

	const handleSpeakerSaved = async () => {
		await refresh()
		editModalOpen.value = false
	}

  await fetchPermissions()
</script>
