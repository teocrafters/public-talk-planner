<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'

  interface PublicTalk {
    id: number
    no: string
    title: string
    multimediaCount: number
    videoCount: number
    status: "circuit_overseer" | "will_be_replaced" | null
    createdAt: Date
  }

  interface Props {
    talk: PublicTalk
    canFlag: boolean
    canUpdate: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    "status-changed": [talk: PublicTalk]
    "edit-requested": [talk: PublicTalk]
    "confirm-requested": [config: { title: string; message: string; action: string; talkId: number }]
  }>()

  const { t } = useI18n()

  const isLoading = ref(false)

  const menuItems = computed(() => {
    const items: Array<DropdownMenuItem> = []

    if (props.canFlag) {
      items.push({
        label: t("publicTalks.actions.blockForOverseer"),
        icon: "i-heroicons-lock-closed",
        onSelect: () => openConfirmDialog("block"),
        disabled: props.talk.status === "circuit_overseer",
      })

      items.push({
        label: t("publicTalks.actions.markForReplacement"),
        icon: "i-heroicons-arrow-path",
        onSelect: () => openConfirmDialog("replace"),
        disabled: props.talk.status === "will_be_replaced",
      })

      if (props.talk.status) {
        items.push({
          label: t("publicTalks.actions.clearStatus"),
          icon: "i-heroicons-x-mark",
          onSelect: () => openConfirmDialog("clear"),
        })
      }
    }

    if (props.canUpdate) {
      items.push({
        label: t("publicTalks.actions.edit"),
        icon: "i-heroicons-pencil-square",
        onSelect: () => emit("edit-requested", props.talk),
      })
    }

    return items
  })

  const openConfirmDialog = (action: "block" | "replace" | "clear") => {
    const configs = {
      block: {
        title: t("publicTalks.confirmations.blockTitle"),
        message: t("publicTalks.confirmations.blockMessage"),
      },
      replace: {
        title: t("publicTalks.confirmations.replaceTitle"),
        message: t("publicTalks.confirmations.replaceMessage"),
      },
      clear: {
        title: t("publicTalks.confirmations.clearTitle"),
        message: t("publicTalks.confirmations.clearMessage"),
      },
    }

    emit("confirm-requested", {
      ...configs[action],
      action,
      talkId: props.talk.id,
    })
  }
</script>

<template>
  <div data-testid="talk-actions-menu">
    <UDropdownMenu
      :items="[menuItems]"
      :content="{ align: 'end' }"
      :ui="{
        content: 'min-w-[48px]',
      }">
      <UButton
        data-testid="talk-actions-button"
        color="neutral"
        variant="outline"
        :icon="isLoading ? 'i-heroicons-arrow-path' : 'i-heroicons-ellipsis-vertical'"
        :loading="isLoading"
        :disabled="isLoading || menuItems.length === 0"
        size="sm"
        :aria-label="t('publicTalks.actions.menu')"
        :ui="{
          base: 'p-3',
        }"
        class="size-10" />
    </UDropdownMenu>
  </div>
</template>
