<script setup lang="ts">
  import type { ConflictingSchedule } from "#shared/types/api-schedule"

  interface Props {
    conflict: ConflictingSchedule | null
  }

  const props = defineProps<Props>()

  const isOpen = defineModel<boolean>("open", { required: true })

  const emit = defineEmits<{
    overwrite: []
  }>()

  const { t } = useI18n()

  const displaySpeakerInfo = computed(() => {
    if (!props.conflict) return ""

    const { speakerName, talkNumber, talkTitle } = props.conflict

    if (talkNumber) {
      return t("meetings.conflict.speakerInfo", {
        speakerName,
        talkNumber,
        talkTitle: talkTitle || t("meetings.noTalkTitle"),
      })
    }

    return t("meetings.conflict.speakerInfoNoNumber", {
      speakerName,
      talkTitle: talkTitle || t("meetings.noTalkTitle"),
    })
  })

  const displayDate = computed(() => {
    if (!props.conflict) return ""
    return formatDatePL(props.conflict.date)
  })

  function handleOverwrite() {
    emit("overwrite")
    isOpen.value = false
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ footer: 'justify-between' }"
    data-testid="schedule-conflict-modal">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t("meetings.conflict.title") }}</h3>
    </template>

    <template #body>
      <div
        v-if="conflict"
        class="space-y-4">
        <p class="text-sm text-default">
          {{ t("meetings.conflict.message") }}
        </p>

        <p class="text-sm font-medium text-muted">{{ displayDate }}</p>

        <div class="rounded-lg border border-warning bg-warning/10 p-4">
          <p class="mb-2 text-xs font-semibold uppercase text-warning">
            {{ t("meetings.conflict.currentSchedule") }}
          </p>
          <p
            class="text-sm text-default"
            data-testid="conflict-speaker-info">
            {{ displaySpeakerInfo }}
          </p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="ghost"
        data-testid="conflict-cancel-button"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>
      <div class="flex gap-2">
        <UButton
          color="warning"
          data-testid="conflict-overwrite-button"
          @click="handleOverwrite">
          {{ t("meetings.conflict.overwrite") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
