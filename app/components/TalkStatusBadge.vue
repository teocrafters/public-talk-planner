<script setup lang="ts">
  interface Props {
    status: "circuit_overseer" | "will_be_replaced" | null
  }

  const props = defineProps<Props>()
  const { t } = useI18n()

  const statusConfig = computed(() => {
    if (!props.status) {
      return null
    }

    const configs = {
      circuit_overseer: {
        color: "warning" as const,
        icon: "i-heroicons-lock-closed",
        label: t("publicTalks.status.circuit_overseer"),
      },
      will_be_replaced: {
        color: "info" as const,
        icon: "i-heroicons-arrow-path",
        label: t("publicTalks.status.will_be_replaced"),
      },
    }

    return configs[props.status]
  })
</script>

<template>
  <UBadge
    v-if="statusConfig"
    data-testid="talk-status-badge"
    :color="statusConfig.color"
    class="gap-1 rounded-sm">
    <UIcon
      :name="statusConfig.icon"
      class="size-3.5" />
    <span>{{ statusConfig.label }}</span>
  </UBadge>
</template>
