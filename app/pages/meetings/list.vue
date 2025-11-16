<script setup lang="ts">
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

  const {
    data: programs,
    pending,
    error,
  } = await useFetch("/api/weekend-meetings", {
    query: {
      startDate: dayjs().subtract(6, "month").unix(),
      endDate: dayjs().add(6, "month").unix(),
    },
  })

  const canSchedulePublicTalks = can("weekend_meetings", "schedule_public_talks")
  const canScheduleRestParts = can("weekend_meetings", "schedule_rest")

  const groupedByMonth = computed(() => {
    if (!programs.value) return new Map()

    const groups = new Map<string, WeekendMeetingListItem[]>()

    programs.value.forEach(program => {
      const monthKey = dayjs.unix(program.date).format("MMMM YYYY")

      if (!groups.has(monthKey)) {
        groups.set(monthKey, [])
      }
      groups.get(monthKey)!.push(program)
    })

    return groups
  })

  function getPartLabel(partType: string): string {
    // Convert snake_case to camelCase
    const camelCaseKey = partType
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

    const key = `weekendMeetings.parts.${camelCaseKey}`
    return t(key)
  }

  function getPartColor(
    partType: string
  ): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" {
    switch (partType) {
      case "chairman":
        return "primary"
      case "public_talk":
      case "circuit_overseer_talk":
        return "warning"
      case "watchtower_study":
        return "info"
      case "reader":
        return "neutral"
      case "closing_prayer":
        return "secondary"
      default:
        return "neutral"
    }
  }

  useSeoPage("meetings.list")
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          data-testid="meetings-title"
          class="text-3xl font-bold tracking-tight text-default">
          {{ t("meetings.title") }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          {{ t("meetings.description") }}
        </p>
      </div>
      <div class="flex flex-row gap-2 sm:flex-col">
        <UButton
          v-if="canSchedulePublicTalks"
          data-testid="manage-button"
          icon="i-heroicons-calendar"
          size="md"
          class="w-full sm:w-auto"
          @click="navigateTo('/meetings/manage-public-talks')">
          {{ t("meetings.managePublicTalksButton") }}
        </UButton>
        <UButton
          v-if="canScheduleRestParts"
          data-testid="rest-parts-manage-button"
          icon="i-heroicons-calendar"
          size="md"
          class="w-full sm:w-auto"
          @click="navigateTo('/meetings/plan-weekend')">
          {{ t("meetings.manageRestParts") }}
        </UButton>
      </div>
    </div>

    <div
      v-if="pending"
      class="space-y-4">
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-24 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      data-testid="error-message"
      color="error"
      :title="t('common.error')"
      :description="error.message" />

    <div
      v-else-if="!programs || programs.length === 0"
      data-testid="empty-state">
      <UAlert
        color="info"
        :title="t('meetings.noSchedules')"
        icon="i-heroicons-information-circle">
        {{ t("meetings.noSchedulesDescription") }}
      </UAlert>
    </div>

    <div
      v-else
      data-testid="meetings-list"
      class="space-y-8">
      <div
        v-for="[month, monthPrograms] in groupedByMonth"
        :key="month"
        class="space-y-3">
        <h2 class="text-xl font-semibold text-muted">{{ month }}</h2>
        <div class="space-y-3">
          <UCard
            v-for="program in monthPrograms"
            :key="program.id"
            :data-testid="`meeting-card-${program.id}`"
            class="hover:shadow-md transition-shadow">
            <div class="space-y-4">
              <!-- Date and CO Visit Badge -->
              <div class="flex items-center gap-2">
                <p
                  data-testid="meeting-date"
                  class="text-lg font-semibold text-default">
                  {{ dayjs.unix(program.date).format("dddd, D MMMM YYYY") }}
                </p>
                <UBadge
                  v-if="program.isCircuitOverseerVisit"
                  color="secondary"
                  variant="subtle"
                  size="sm">
                  {{ t("meetings.circuitOverseerVisit") }}
                </UBadge>
              </div>

              <!-- All Meeting Parts -->
              <div class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="part in program.parts"
                  :key="part.id"
                  class="flex items-start gap-2">
                  <UBadge
                    :color="getPartColor(part.type)"
                    variant="subtle"
                    size="xs"
                    class="shrink-0 mt-1">
                    {{ getPartLabel(part.type) }}
                  </UBadge>
                  <div class="flex-1 min-w-0">
                    <!-- Display speaker name for public talk or CO talk parts -->
                    <p
                      v-if="part.type === 'public_talk' || part.type === 'circuit_overseer_talk'"
                      data-testid="meeting-speaker"
                      class="text-sm font-medium text-default truncate">
                      <template v-if="part.assignment">
                        {{ part.assignment.personName }}
                      </template>
                      <template v-else>
                        <span class="text-dimmed italic">{{ t("meetings.noSchedules") }}</span>
                      </template>
                    </p>
                    <!-- Display assignment for other parts -->
                    <p
                      v-else-if="part.assignment"
                      class="text-sm font-medium text-default truncate">
                      {{ part.assignment.personName }}
                    </p>
                    <p
                      v-else
                      class="text-sm text-dimmed italic">
                      {{ t("meetings.noSchedules") }}
                    </p>
                    <!-- Display talk title for public talk or CO talk parts -->
                    <p
                      v-if="part.type === 'public_talk' || part.type === 'circuit_overseer_talk'"
                      data-testid="meeting-talk"
                      class="text-xs text-dimmed truncate mt-1">
                      <template v-if="part.name">
                        {{ part.name }}
                      </template>
                      <template v-else>
                        <span class="italic">{{ t("meetings.noTalkTitle") }}</span>
                      </template>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
