<script setup lang="ts">
  interface Props {
    title: string
    message: string
    confirmText: string
    cancelText: string
    variant?: "warning" | "danger" | "info"
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: "warning",
  })

  const modelValue = defineModel<boolean>({ required: true })

  const emit = defineEmits<{
    confirm: []
  }>()

  const handleConfirm = () => {
    emit("confirm")
    modelValue.value = false
  }

  const variantConfig = computed(() => {
    const configs = {
      warning: {
        icon: "i-heroicons-exclamation-triangle",
        iconColor: "text-warning-500",
        confirmColor: "warning" as const,
      },
      danger: {
        icon: "i-heroicons-exclamation-circle",
        iconColor: "text-error-500",
        confirmColor: "error" as const,
      },
      info: {
        icon: "i-heroicons-information-circle",
        iconColor: "text-info-500",
        confirmColor: "primary" as const,
      },
    }

    return configs[props.variant]
  })
</script>

<template>
  <UModal v-model:open="modelValue" :ui="{ footer: 'justify-between' }">
    <template #header>
      <div class="flex items-start gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--ui-bg-elevated)]">
          <UIcon
            :name="variantConfig.icon"
            :class="variantConfig.iconColor"
            class="size-6" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">
            {{ title }}
          </h3>
          <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
            {{ message }}
          </p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        variant="outline"
        color="neutral"
        class="w-full sm:w-auto"
        @click="close">
        {{ cancelText }}
      </UButton>
      <UButton
        :color="variantConfig.confirmColor"
        class="w-full sm:w-auto"
        @click="handleConfirm">
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>
