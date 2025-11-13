<script setup lang="ts">
	interface ScheduledMeeting {
		id: string
		date: Date
		meetingProgramName: string
		partName: string
		speakerFirstName: string
		speakerLastName: string
		talkNumber: string | null
		talkTitle: string | null
		isCircuitOverseerVisit: boolean
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

	await fetchPermissions()

	const { data: schedules, pending, error } = await useFetch<ScheduledMeeting[]>("/api/schedules")

	const canSchedulePublicTalks = can("weekend_meetings", "schedule_public_talks")

	const groupedByMonth = computed(() => {
		if (!schedules.value) return new Map()

		const groups = new Map<string, ScheduledMeeting[]>()

		schedules.value.forEach(schedule => {
			const monthKey = dayjs(schedule.date).format("MMMM YYYY")

			if (!groups.has(monthKey)) {
				groups.set(monthKey, [])
			}
			groups.get(monthKey)!.push(schedule)
		})

		return groups
	})

	useSeoMeta({
		title: t("meta.meetings.list.title"),
		description: t("meta.meetings.list.description"),
		ogTitle: t("meta.meetings.list.title"),
		ogDescription: t("meta.meetings.list.description"),
		robots: "noindex, nofollow",
	})
</script>

<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 data-testid="meetings-title" class="text-3xl font-bold tracking-tight text-default">
					{{ t("meetings.title") }}
				</h1>
				<p class="mt-2 text-sm text-muted">
					{{ t("meetings.description") }}
				</p>
			</div>
			<UButton
				v-if="canSchedulePublicTalks"
				data-testid="manage-button"
				icon="i-heroicons-calendar"
				size="md"
				class="w-full sm:w-auto"
				@click="navigateTo('/meetings/manage-public-talks')">
				{{ t("meetings.managePublicTalks") }}
			</UButton>
		</div>

		<div v-if="pending" class="space-y-4">
			<USkeleton v-for="i in 3" :key="i" class="h-24 w-full" />
		</div>

		<UAlert
			v-else-if="error"
			data-testid="error-message"
			color="error"
			:title="t('common.error')"
			:description="error.message" />

		<div
			v-else-if="!schedules || schedules.length === 0"
			data-testid="empty-state">
			<UAlert
				color="info"
				:title="t('meetings.noSchedules')"
				icon="i-heroicons-information-circle">
				{{ t("meetings.noSchedulesDescription") }}
			</UAlert>
		</div>

		<div v-else data-testid="meetings-list" class="space-y-8">
			<div v-for="[month, meetings] in groupedByMonth" :key="month" class="space-y-3">
				<h2 class="text-xl font-semibold text-muted">{{ month }}</h2>
				<div class="space-y-3">
					<UCard
						v-for="meeting in meetings"
						:key="meeting.id"
						:data-testid="`meeting-card-${meeting.id}`"
						class="hover:shadow-md transition-shadow">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<p data-testid="meeting-date" class="text-sm font-medium text-default">
										{{ dayjs(meeting.date).format("dddd, D MMMM YYYY") }}
									</p>
									<UBadge
										v-if="meeting.isCircuitOverseerVisit"
										color="secondary"
										variant="subtle"
										size="xs">
										{{ t("meetings.circuitOverseerVisit") }}
									</UBadge>
								</div>
								<p data-testid="meeting-speaker" class="font-medium text-lg">
									{{ meeting.speakerFirstName }} {{ meeting.speakerLastName }}
								</p>
								<p data-testid="meeting-talk" class="text-sm text-dimmed mt-1">
									<template v-if="meeting.talkNumber && meeting.talkTitle">
										#{{ meeting.talkNumber }} - {{ meeting.talkTitle }}
									</template>
									<template v-else-if="meeting.talkTitle">
										{{ meeting.talkTitle }}
									</template>
									<template v-else>
										{{ t("meetings.noTalk") }}
									</template>
								</p>
							</div>
						</div>
					</UCard>
				</div>
			</div>
		</div>
	</div>
</template>
