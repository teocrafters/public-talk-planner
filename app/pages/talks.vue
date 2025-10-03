<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-default">
				{{ t("publicTalks.title") }}
			</h1>
			<p class="mt-2 text-sm text-muted">
				{{ t("publicTalks.totalTalks", { count: talks?.length || 0 }) }}
			</p>
		</div>

		<div class="flex flex-col sm:flex-row gap-4">
			<UInput
				v-model="searchQuery"
				:placeholder="t('publicTalks.searchPlaceholder')"
				icon="i-heroicons-magnifying-glass"
				class="flex-1"
			/>

			<USelect v-model="sortOrder" :items="sortOptions" value-key="value" class="w-full sm:w-48" />
		</div>

		<div v-if="pending" class="space-y-4">
			<USkeleton v-for="i in 5" :key="i" class="h-24 w-full" />
		</div>

		<UAlert
			v-else-if="error"
			color="error"
			:title="t('common.error')"
			:description="error.message"
		/>

		<div v-else-if="filteredTalks.length > 0" class="space-y-3">
			<UCard v-for="talk in filteredTalks" :key="talk.id" class="hover:shadow-md transition-shadow">
				<div class="flex items-start justify-between gap-4">
					<h3 class="text-lg font-medium text-default flex-1">
						{{ talk.title }}
					</h3>

					<div class="flex gap-2 shrink-0">
						<UBadge v-if="talk.multimediaCount > 0" color="info" variant="subtle">
							<UIcon name="i-heroicons-photo" class="w-4 h-4" />
							{{ talk.multimediaCount }}
						</UBadge>

						<UBadge v-if="talk.videoCount > 0" color="secondary" variant="subtle">
							<UIcon name="i-heroicons-video-camera" class="w-4 h-4" />
							{{ talk.videoCount }}
						</UBadge>
					</div>
				</div>
			</UCard>
		</div>

		<UAlert v-else color="info" :title="t('publicTalks.noResults')" icon="i-heroicons-information-circle" />
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	auth: {
		only: "user",
		redirectGuestTo: "/",
	},
	layout: "authenticated",
})

const { t } = useI18n()

const { data: talks, pending, error } = await useFetch("/api/public-talks")

const searchQuery = ref("")
const sortOrder = ref<"asc" | "desc">("asc")

const sortOptions = computed(() => [
	{ value: "asc", label: t("publicTalks.sortAscending") },
	{ value: "desc", label: t("publicTalks.sortDescending") },
])

const filteredTalks = computed(() => {
	if (!talks.value) return []

	let result = [...talks.value]

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase().trim()
		result = result.filter(
			(talk) => talk.no.toString().includes(query) || talk.title.toLowerCase().includes(query),
		)
	}

	result.sort((a, b) => (sortOrder.value === "asc" ? a.no - b.no : b.no - a.no))

	return result
})

useSeoMeta({
	title: t("meta.publicTalks.title"),
	description: t("meta.publicTalks.description"),
	ogTitle: t("meta.publicTalks.title"),
	ogDescription: t("meta.publicTalks.description"),
	robots: "noindex, nofollow",
})
</script>
