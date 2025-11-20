<script setup lang="ts">
  import type { WeekendMeetingListItem } from "~/shared/types/api-weekend-meetings"

  type WeekendMeetingPart = WeekendMeetingListItem["parts"][number]

  type DisplayItem =
    | {
        type: "talk"
        part: WeekendMeetingPart
      }
    | {
        type: "watchtower_with_reader"
        watchtowerPart: WeekendMeetingPart
        readerPart?: WeekendMeetingPart
      }
    | {
        type: "single"
        part: WeekendMeetingPart
      }

  const props = defineProps<{
    item: DisplayItem
  }>()

  const { t } = useI18n()

  function getPartLabel(partType: string): string {
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
</script>

<template>
  <!-- Talk layout (public_talk, circuit_overseer_talk) -->
  <div
    v-if="item.type === 'talk'"
    class="flex items-start gap-2">
    <UBadge
      :color="getPartColor(item.part.type)"
      variant="subtle"
      size="md"
      class="w-40 mt-1 whitespace-normal text-left leading-tight">
      {{ getPartLabel(item.part.type) }}
    </UBadge>
    <!-- Talk number badge -->
    <UBadge
      v-if="item.part.talkNumber"
      color="neutral"
      variant="soft"
      size="sm"
      class="w-8 h-6 flex items-center justify-center text-xs font-medium leading-none mt-1"
      data-testid="meeting-talk-number">
      {{ item.part.talkNumber }}
    </UBadge>
    <div class="flex-1 min-w-0">
      <!-- Talk title (prominent) -->
      <p
        data-testid="meeting-talk"
        class="text-base font-semibold text-primary line-clamp-2 mb-1">
        <template v-if="item.part.name">
          {{ item.part.name }}
        </template>
        <template v-else>
          <span class="italic">{{ t("meetings.noTalkTitle") }}</span>
        </template>
      </p>
      <!-- Speaker name (more prominent than before) -->
      <p
        data-testid="meeting-speaker"
        class="text-base text-default font-medium">
        <template v-if="item.part.assignment">
          {{ item.part.assignment.personName }}
        </template>
        <template v-else>
          <span class="italic">{{ t("meetings.noSchedules") }}</span>
        </template>
      </p>
    </div>
  </div>

  <!-- Watchtower with reader layout (two columns) -->
  <div
    v-else-if="item.type === 'watchtower_with_reader'"
    class="flex items-start gap-2">
    <UBadge
      :color="getPartColor(item.watchtowerPart.type)"
      variant="subtle"
      size="md"
      class="w-40 mt-1 whitespace-normal text-left leading-tight">
      {{ getPartLabel(item.watchtowerPart.type) }}
    </UBadge>
    <div class="flex-1 min-w-0">
      <div class="grid grid-cols-2 gap-3">
        <!-- Watchtower conductor -->
        <div>
          <label class="block text-xs text-muted mb-1">
            {{ t("weekendMeetings.conductor") }}
          </label>
          <p
            v-if="item.watchtowerPart.assignment"
            class="text-base font-medium text-default">
            {{ item.watchtowerPart.assignment.personName }}
          </p>
          <p
            v-else
            class="text-base text-dimmed italic">
            {{ t("meetings.noSchedules") }}
          </p>
        </div>
        <!-- Reader -->
        <div>
          <label class="block text-xs text-muted mb-1">
            {{ t("weekendMeetings.reader") }}
          </label>
          <p
            v-if="item.readerPart?.assignment"
            class="text-base font-medium text-default">
            {{ item.readerPart.assignment.personName }}
          </p>
          <p
            v-else
            class="text-base text-dimmed italic">
            {{ t("meetings.noSchedules") }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Single person layout (chairman, closing_prayer) -->
  <div
    v-else-if="item.type === 'single'"
    class="flex items-start gap-2">
    <UBadge
      :color="getPartColor(item.part.type)"
      variant="subtle"
      size="md"
      class="w-40 mt-1 whitespace-normal text-left leading-tight">
      {{ getPartLabel(item.part.type) }}
    </UBadge>
    <div class="flex-1 min-w-0">
      <p
        v-if="item.part.assignment"
        class="text-base font-medium text-default">
        {{ item.part.assignment.personName }}
      </p>
      <p
        v-else
        class="text-base text-dimmed italic">
        {{ t("meetings.noSchedules") }}
      </p>
    </div>
  </div>
</template>
