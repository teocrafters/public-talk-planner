<script setup lang="ts">
  const isOpen = defineModel<boolean>("open", { required: true })
  const emit = defineEmits<{ saved: [] }>()

  const { t } = useI18n()
  const toast = useToast()

  interface ExtractedSpeaker {
    firstName: string
    lastName: string
    phone: string
    talkNumbers: string[]
    congregation?: string
    congregationId?: string | null
    talkIds?: number[]
    errors?: string[]
    selected: boolean
  }

  const jobStatus = ref<"idle" | "uploading" | "polling" | "review" | "importing">("idle")
  const jobId = ref<string | null>(null)
  const extractedSpeakers = ref<ExtractedSpeaker[]>([])
  const globalCongregationId = ref<string | undefined>(undefined)
  const extractedCongregationName = ref<string>("")
  const isSubmitting = ref(false)

  const { data: congregations } =
    await useFetch<{ id: string; name: string }[]>("/api/congregations")
  const { data: talks } =
    await useFetch<{ id: number; no: string; title: string }[]>("/api/public-talks")

  const congregationItems = computed(() => {
    return (
      congregations.value?.map(c => ({
        label: c.name,
        value: c.id,
      })) || []
    )
  })

  const talkItems = computed(() => {
    return (
      talks.value?.map(t => ({
        label: t.no,
        longLabel: t.title,
        value: t.no,
      })) || []
    )
  })

  async function handleFileUpload(file: File | null | undefined) {
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      toast.add({ title: t("validation.fileTooLarge"), color: "error" })
      return
    }

    jobStatus.value = "uploading"

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await $fetch<{ jobId: string }>("/api/speakers/import", {
        method: "POST",
        body: formData,
      })

      jobId.value = response.jobId
      jobStatus.value = "polling"
      startPolling()
    } catch (error) {
      console.error("Upload error:", error)
      toast.add({ title: t("speakers.messages.importError"), color: "error" })
      jobStatus.value = "idle"
    }
  }

  let pollingInterval: NodeJS.Timeout | null = null

  function startPolling() {
    if (!jobId.value) return

    pollingInterval = setInterval(async () => {
      try {
        const status = await $fetch<{
          status: string
          data?: {
            congregation: string
            congregationId: string | null
            speakers: ExtractedSpeaker[]
          }
          error?: string
        }>(`/api/speakers/import/status/${jobId.value}`)

        if (status.status === "completed" && status.data) {
          stopPolling()
          extractedCongregationName.value = status.data.congregation
          globalCongregationId.value = status.data.congregationId || undefined
          extractedSpeakers.value = status.data.speakers.map(s => ({
            ...s,
            selected: true,
            errors: validateSpeaker(s),
          }))
          jobStatus.value = "review"
        } else if (status.status === "failed") {
          stopPolling()
          toast.add({ title: t("speakers.messages.extractionFailed"), color: "error" })
          jobStatus.value = "idle"
        }
      } catch (error) {
        console.error("Polling error:", error)
        stopPolling()
        toast.add({ title: t("speakers.messages.networkError"), color: "error" })
        jobStatus.value = "idle"
      }
    }, 1500)

    setTimeout(() => {
      if (pollingInterval) {
        stopPolling()
        toast.add({ title: t("speakers.messages.timeout"), color: "warning" })
        jobStatus.value = "idle"
      }
    }, 90000)
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  function validateSpeaker(speaker: ExtractedSpeaker): string[] {
    const errors: string[] = []

    if (!speaker.firstName || speaker.firstName.trim().length === 0) {
      errors.push(t("validation.firstNameRequired"))
    }

    if (!speaker.lastName || speaker.lastName.trim().length === 0) {
      errors.push(t("validation.lastNameRequired"))
    }

    if (!speaker.phone || !/^\d{9}$/.test(speaker.phone.replace(/\D/g, ""))) {
      errors.push(t("validation.phoneInvalid"))
    }

    return errors
  }

  function selectAll() {
    extractedSpeakers.value.forEach(s => {
      if (!s.errors || s.errors.length === 0) {
        s.selected = true
      }
    })
  }

  function deselectAll() {
    extractedSpeakers.value.forEach(s => {
      s.selected = false
    })
  }

  const selectedCount = computed(() => {
    return extractedSpeakers.value.filter(s => s.selected && (!s.errors || s.errors.length === 0))
      .length
  })

  async function handleImport() {
    if (!globalCongregationId.value) {
      toast.add({ title: t("validation.congregationRequired"), color: "error" })
      return
    }

    const selectedSpeakers = extractedSpeakers.value
      .filter(s => s.selected && (!s.errors || s.errors.length === 0))
      .map(s => ({
        ...s,
        congregationId: globalCongregationId.value,
      }))

    if (selectedSpeakers.length === 0) {
      toast.add({ title: t("speakers.import.noValidSpeakers"), color: "warning" })
      return
    }

    isSubmitting.value = true
    jobStatus.value = "importing"

    try {
      await $fetch("/api/speakers/bulk-import", {
        method: "POST",
        body: { speakers: selectedSpeakers },
      })

      toast.add({
        title: t("speakers.messages.importSuccess", { count: selectedSpeakers.length }),
        color: "success",
      })

      emit("saved")
      isOpen.value = false
    } catch (error) {
      console.error("Import error:", error)
      toast.add({ title: t("speakers.messages.importError"), color: "error" })
      jobStatus.value = "review"
    } finally {
      isSubmitting.value = false
    }
  }

  function resetState() {
    jobStatus.value = "idle"
    jobId.value = null
    extractedSpeakers.value = []
    globalCongregationId.value = undefined
    extractedCongregationName.value = ""
    isSubmitting.value = false
  }

  watch(isOpen, open => {
    if (!open) {
      stopPolling()
      resetState()
    }
  })

  onUnmounted(() => {
    stopPolling()
  })
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-3xl' }"
    data-testid="speaker-import-modal">
    <template #header>
      <h3
        class="text-lg font-semibold"
        data-testid="speaker-import-modal-title">
        {{ t("speakers.import.title") }}
      </h3>
    </template>

    <template #body>
      <div
        v-if="jobStatus === 'idle'"
        class="space-y-4">
        <UFileUpload
          accept="image/*,application/pdf"
          :label="t('speakers.import.uploadLabel')"
          :description="t('speakers.import.uploadDescription')"
          class="min-h-48"
          data-testid="speaker-import-file-upload"
          @update:model-value="handleFileUpload" />
      </div>

      <div
        v-else-if="jobStatus === 'uploading' || jobStatus === 'polling'"
        class="flex flex-col items-center justify-center py-12"
        data-testid="speaker-import-processing">
        <UIcon
          name="i-lucide-loader-2"
          class="size-12 animate-spin text-primary" />
        <p class="mt-4 text-sm text-muted">{{ t("speakers.import.processing") }}</p>
      </div>

      <div
        v-else-if="jobStatus === 'review'"
        class="space-y-4">
        <UFormField
          :label="t('speakers.modal.congregation')"
          required>
          <div class="flex items-center gap-2">
            <USelect
              v-model="globalCongregationId"
              :items="congregationItems"
              value-key="value"
              class="flex-1"
              data-testid="speaker-import-global-congregation" />
            <div
              v-if="extractedCongregationName"
              class="text-sm text-muted">
              ({{ t("speakers.import.extracted") }}: {{ extractedCongregationName || "" }})
            </div>
          </div>
        </UFormField>

        <div class="flex items-center justify-between">
          <UButton
            size="sm"
            data-testid="speaker-import-select-all"
            @click="selectAll">
            {{ t("speakers.import.selectAll") }}
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            data-testid="speaker-import-deselect-all"
            @click="deselectAll">
            {{ t("speakers.import.deselectAll") }}
          </UButton>
        </div>

        <div
          class="max-h-96 space-y-3 overflow-y-auto"
          data-testid="speaker-import-speakers-list">
          <UCard
            v-for="(speaker, index) in extractedSpeakers"
            :key="index"
            :class="{ 'border-error': speaker.errors?.length }"
            :data-testid="`speaker-import-card-${index}`">
            <div class="flex items-start gap-3">
              <UCheckbox
                v-model="speaker.selected"
                :disabled="!!speaker.errors?.length"
                :data-testid="`speaker-import-checkbox-${index}`" />

              <div class="flex-1 space-y-2">
                <div class="grid grid-cols-3 gap-3">
                  <UFormField :label="t('speakers.modal.firstName')">
                    <UInput
                      v-model="speaker.firstName"
                      :data-testid="`speaker-import-first-name-${index}`" />
                  </UFormField>

                  <UFormField :label="t('speakers.modal.lastName')">
                    <UInput
                      v-model="speaker.lastName"
                      :data-testid="`speaker-import-last-name-${index}`" />
                  </UFormField>

                  <UFormField :label="t('speakers.modal.phone')">
                    <UInput
                      v-model="speaker.phone"
                      placeholder="123-456-789"
                      :data-testid="`speaker-import-phone-${index}`" />
                  </UFormField>

                  <UFormField
                    :label="t('speakers.modal.talks')"
                    class="col-span-3">
                    <USelect
                      v-model="speaker.talkNumbers"
                      :items="talkItems"
                      value-key="value"
                      multiple
                      class="w-full"
                      :data-testid="`speaker-import-talks-${index}`">
                      <template #item-label="{ item }">
                        {{ item.label }} - {{ item.longLabel }}
                      </template>
                    </USelect>
                  </UFormField>
                </div>

                <div
                  v-if="speaker.errors?.length"
                  class="text-xs text-error">
                  <p
                    v-for="error in speaker.errors"
                    :key="error">
                    ⚠️ {{ error }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="ghost"
        data-testid="speaker-import-cancel"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>

      <UButton
        v-if="jobStatus === 'review'"
        :loading="isSubmitting"
        :disabled="selectedCount === 0"
        data-testid="speaker-import-submit"
        @click="handleImport">
        {{ t("speakers.import.importSelected", { count: selectedCount }) }}
      </UButton>
    </template>
  </UModal>
</template>
