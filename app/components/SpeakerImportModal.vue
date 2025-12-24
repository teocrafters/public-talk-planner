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

    // Match information
    matchStatus: "new" | "update" | "no-change" | "restore"
    matchedSpeakerId?: string

    // Existing speaker data
    existingSpeaker?: {
      id: string
      phone: string
      congregationId: string
      congregationName: string
      talkIds: number[]
    }

    // Diff information
    diff?: {
      phone?: { old: string; new: string }
      talks?: {
        added: number[]
        removed: number[]
        unchanged: number[]
      }
      congregation?: {
        oldId: string
        oldName: string
        newId: string
        newName: string
      }
    }

    // Manual override state
    manualOverride?: {
      type: "reject" | "select-different"
      selectedSpeakerId?: string
    }
  }

  interface MissingSpeaker {
    id: string
    firstName: string
    lastName: string
    congregationName: string
    assignedTalks: string[]
    scheduledTalksCount: number
    selected: boolean
  }

  const jobStatus = ref<"idle" | "uploading" | "polling" | "review" | "importing">("idle")
  const jobId = ref<string | null>(null)
  const extractedSpeakers = ref<ExtractedSpeaker[]>([])
  const missingSpeakers = ref<MissingSpeaker[]>([])
  const globalCongregationId = ref<string | undefined>(undefined)
  const extractedCongregationName = ref<string>("")
  const isSubmitting = ref(false)

  // Manual match selection modal
  const manualMatchModalOpen = ref(false)
  const currentSpeakerForManualMatch = ref<ExtractedSpeaker | null>(null)
  const selectedSpeakerForManualMatch = ref<string | undefined>(undefined)
  const speakerSearchResults = ref<
    Array<{
      id: string
      firstName: string
      lastName: string
      congregationName: string
      archived: boolean
    }>
  >([])

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
            missingSpeakers: MissingSpeaker[]
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
          }))
          missingSpeakers.value = status.data.missingSpeakers || []
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

    if (!speaker.firstName?.trim()) {
      errors.push(t("validation.firstNameRequired"))
    }

    if (!speaker.lastName?.trim()) {
      errors.push(t("validation.lastNameRequired"))
    }

    const cleanedPhone = speaker.phone?.replace(/\D/g, "") || ""
    if (!cleanedPhone || cleanedPhone.length !== 9) {
      errors.push(t("validation.phoneInvalid"))
    }

    return errors
  }

  function selectAll() {
    extractedSpeakers.value.forEach(s => {
      s.selected = true
    })
  }

  function deselectAll() {
    extractedSpeakers.value.forEach(s => {
      s.selected = false
    })
  }

  const selectedCount = computed(() => {
    return extractedSpeakers.value.filter(s => s.selected).length
  })

  const allUnchanged = computed(() => {
    return extractedSpeakers.value.every(s => s.matchStatus === "no-change")
  })

  function getStatusBadgeColor(
    status: string
  ): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" {
    switch (status) {
      case "new":
        return "success"
      case "update":
        return "info"
      case "no-change":
        return "neutral"
      case "restore":
        return "warning"
      default:
        return "neutral"
    }
  }

  function getTalkBadgeColor(
    talkId: number,
    speaker: ExtractedSpeaker,
    row: "old" | "new"
  ): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" {
    if (!speaker.diff?.talks) return "neutral"

    const { added, removed, unchanged } = speaker.diff.talks

    if (row === "new") {
      if (added.includes(talkId)) return "success" // Added
      if (unchanged.includes(talkId)) return "neutral" // Unchanged
    } else {
      if (removed.includes(talkId)) return "error" // Removed
      if (unchanged.includes(talkId)) return "neutral" // Unchanged
    }

    return "neutral"
  }

  function getExistingTalkIds(speaker: ExtractedSpeaker): number[] {
    if (!speaker.existingSpeaker?.talkIds) return []
    return speaker.existingSpeaker.talkIds
  }

  function getTalkNumber(talkId: number): string {
    const talk = talks.value?.find(t => t.id === talkId)
    return talk?.no || String(talkId)
  }

  function getTalkId(talkNo: string): number {
    const talk = talks.value?.find(t => t.no === talkNo)
    return talk?.id || 0
  }

  function handleTreatAsNew(speaker: ExtractedSpeaker) {
    speaker.matchStatus = "new"
    speaker.diff = undefined
    speaker.existingSpeaker = undefined
    speaker.manualOverride = { type: "reject" }
  }

  async function handleChangeMatch(speaker: ExtractedSpeaker) {
    currentSpeakerForManualMatch.value = speaker
    selectedSpeakerForManualMatch.value = undefined
    manualMatchModalOpen.value = true

    // Load all speakers for search
    try {
      const response = await $fetch<
        Array<{
          id: string
          firstName: string
          lastName: string
          congregationId: string
          congregation: { name: string }
          archived: boolean
        }>
      >("/api/speakers")

      speakerSearchResults.value = response.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        congregationName: s.congregation.name,
        archived: s.archived,
      }))
    } catch (error) {
      console.error("Failed to load speakers:", error)
      toast.add({ title: t("speakers.messages.networkError"), color: "error" })
    }
  }

  async function applyManualMatch() {
    if (!currentSpeakerForManualMatch.value || !selectedSpeakerForManualMatch.value) return

    const speaker = currentSpeakerForManualMatch.value
    const selectedSpeakerId = selectedSpeakerForManualMatch.value

    // Fetch the selected speaker's details
    try {
      const selectedSpeaker = await $fetch<{
        id: string
        phone: string
        congregationId: string
        congregation: { name: string }
        talks: Array<{ id: number }>
      }>(`/api/speakers/${selectedSpeakerId}`)

      // Update speaker with manual match
      speaker.matchedSpeakerId = selectedSpeaker.id
      speaker.existingSpeaker = {
        id: selectedSpeaker.id,
        phone: selectedSpeaker.phone,
        congregationId: selectedSpeaker.congregationId,
        congregationName: selectedSpeaker.congregation.name,
        talkIds: selectedSpeaker.talks.map(t => t.id),
      }
      speaker.manualOverride = {
        type: "select-different",
        selectedSpeakerId: selectedSpeaker.id,
      }

      // Recalculate diff
      const hasPhoneChange = speaker.phone !== selectedSpeaker.phone
      const oldTalkIds = selectedSpeaker.talks.map(t => t.id)
      const newTalkIds = speaker.talkIds || []

      const added = newTalkIds.filter(id => !oldTalkIds.includes(id))
      const removed = oldTalkIds.filter(id => !newTalkIds.includes(id))
      const unchanged = newTalkIds.filter(id => oldTalkIds.includes(id))

      const hasTalkChange = added.length > 0 || removed.length > 0
      const hasCongregationChange = speaker.congregationId !== selectedSpeaker.congregationId

      if (hasPhoneChange || hasTalkChange || hasCongregationChange) {
        speaker.matchStatus = "update"
        speaker.diff = {
          phone: hasPhoneChange ? { old: selectedSpeaker.phone, new: speaker.phone } : undefined,
          talks: hasTalkChange ? { added, removed, unchanged } : undefined,
          congregation: hasCongregationChange
            ? {
                oldId: selectedSpeaker.congregationId,
                oldName: selectedSpeaker.congregation.name,
                newId: speaker.congregationId || "",
                newName:
                  congregations.value?.find(c => c.id === speaker.congregationId)?.name || "",
              }
            : undefined,
        }
      } else {
        speaker.matchStatus = "no-change"
        speaker.diff = undefined
      }

      manualMatchModalOpen.value = false
      currentSpeakerForManualMatch.value = null
      selectedSpeakerForManualMatch.value = undefined
    } catch (error) {
      console.error("Failed to fetch speaker details:", error)
      toast.add({ title: t("speakers.messages.networkError"), color: "error" })
    }
  }

  function determineOperation(speaker: ExtractedSpeaker): string {
    if (speaker.manualOverride?.type === "reject") return "create"

    switch (speaker.matchStatus) {
      case "new":
        return "create"
      case "update":
        return "update"
      case "restore":
        return "restore"
      case "no-change":
        return "skip"
      default:
        return "create"
    }
  }

  async function handleImport() {
    if (!globalCongregationId.value) {
      toast.add({ title: t("validation.congregationRequired"), color: "error" })
      return
    }

    const speakersToImport = extractedSpeakers.value
      .filter(s => s.selected && s.matchStatus !== "no-change")
      .map(s => ({
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        congregationId: s.congregationId || globalCongregationId.value!,
        talkIds: s.talkNumbers.map(no => getTalkId(no)).filter(id => id !== 0),
        operation: determineOperation(s),
        existingSpeakerId: s.matchedSpeakerId,
        diff: s.diff,
      }))

    const speakersToArchive = missingSpeakers.value.filter(s => s.selected).map(s => s.id)

    if (speakersToImport.length === 0 && speakersToArchive.length === 0) {
      toast.add({ title: t("speakers.import.noValidSpeakers"), color: "warning" })
      return
    }

    isSubmitting.value = true
    jobStatus.value = "importing"

    try {
      const response = await $fetch<{
        counts: {
          created: number
          updated: number
          restored: number
          skipped: number
          archived: number
        }
      }>("/api/speakers/bulk-import", {
        method: "POST",
        body: { speakers: speakersToImport, speakersToArchive },
      })

      const parts = []
      if (response.counts.created > 0)
        parts.push(`${response.counts.created} ${t("speakers.import.created")}`)
      if (response.counts.updated > 0)
        parts.push(`${response.counts.updated} ${t("speakers.import.updated")}`)
      if (response.counts.restored > 0)
        parts.push(`${response.counts.restored} ${t("speakers.import.restored")}`)
      if (response.counts.archived > 0)
        parts.push(`${response.counts.archived} ${t("speakers.import.archived")}`)

      const message = `${t("speakers.import.success")}: ${parts.join(", ")}`

      toast.add({
        title: message,
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
    missingSpeakers.value = []
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

        <UAlert
          v-if="allUnchanged"
          color="info"
          :title="t('speakers.import.nothingToImport')"
          icon="i-lucide-info"
          data-testid="speaker-import-nothing-to-import" />

        <div
          v-else
          class="flex items-center justify-between">
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
            :data-testid="`speaker-import-card-${index}`">
            <div class="flex items-start gap-3">
              <UCheckbox
                v-model="speaker.selected"
                :disabled="speaker.matchStatus === 'no-change'"
                :data-testid="`speaker-import-checkbox-${index}`" />

              <div class="flex-1 space-y-3">
                <!-- Match Status Badge -->
                <div class="flex items-center justify-between">
                  <UBadge
                    :color="getStatusBadgeColor(speaker.matchStatus)"
                    variant="subtle"
                    :data-testid="`speaker-import-status-${index}`">
                    {{ t(`speakers.import.status.${speaker.matchStatus}`) }}
                  </UBadge>

                  <!-- Manual Override Controls -->
                  <div
                    v-if="speaker.matchStatus !== 'new' && speaker.matchStatus !== 'no-change'"
                    class="flex gap-2">
                    <UButton
                      size="xs"
                      variant="ghost"
                      :data-testid="`speaker-import-treat-as-new-${index}`"
                      @click="handleTreatAsNew(speaker)">
                      {{ t("speakers.import.treatAsNew") }}
                    </UButton>
                    <UButton
                      size="xs"
                      variant="outline"
                      :data-testid="`speaker-import-change-match-${index}`"
                      @click="handleChangeMatch(speaker)">
                      {{ t("speakers.import.changeMatch") }}
                    </UButton>
                  </div>
                </div>

                <!-- Congregation Transfer Alert -->
                <UAlert
                  v-if="speaker.diff?.congregation"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  :title="t('speakers.import.congregationTransfer')"
                  :description="`${speaker.diff.congregation.oldName} → ${speaker.diff.congregation.newName}`"
                  :data-testid="`speaker-import-congregation-transfer-${index}`" />

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
                    <!-- Phone Diff -->
                    <div
                      v-if="speaker.diff?.phone"
                      class="space-y-1">
                      <div class="text-xs text-muted line-through">
                        {{ formatPhoneNumber(speaker.diff.phone.old) }}
                      </div>
                      <UInput
                        v-model="speaker.phone"
                        placeholder="123-456-789"
                        :data-testid="`speaker-import-phone-${index}`" />
                    </div>
                    <UInput
                      v-else
                      v-model="speaker.phone"
                      placeholder="123-456-789"
                      :data-testid="`speaker-import-phone-${index}`" />
                  </UFormField>

                  <UFormField
                    :label="t('speakers.modal.talks')"
                    class="col-span-3">
                    <!-- Talk List Diff -->
                    <div
                      v-if="speaker.diff?.talks"
                      class="space-y-2">
                      <!-- Existing talks row -->
                      <div class="flex flex-wrap items-center gap-1">
                        <span class="text-xs text-dimmed"
                          >{{ t("speakers.import.existingTalks") }}:</span
                        >
                        <UBadge
                          v-for="talkId in getExistingTalkIds(speaker)"
                          :key="`old-${talkId}`"
                          :color="getTalkBadgeColor(talkId, speaker, 'old')"
                          variant="subtle"
                          size="xs"
                          :data-testid="`speaker-import-existing-talk-${index}-${talkId}`">
                          {{ getTalkNumber(talkId) }}
                        </UBadge>
                      </div>

                      <!-- New talks row -->
                      <div class="flex flex-wrap items-center gap-1">
                        <span class="text-xs text-dimmed"
                          >{{ t("speakers.import.newTalks") }}:</span
                        >
                        <UBadge
                          v-for="talkNo in speaker.talkNumbers"
                          :key="`new-${talkNo}`"
                          :color="getTalkBadgeColor(getTalkId(talkNo), speaker, 'new')"
                          variant="subtle"
                          size="xs"
                          :data-testid="`speaker-import-new-talk-${index}-${talkNo}`">
                          {{ talkNo }}
                        </UBadge>
                      </div>
                    </div>

                    <!-- Regular talk select (no diff) -->
                    <USelect
                      v-else
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
              </div>
            </div>
          </UCard>
        </div>

        <!-- Missing speakers to archive -->
        <div
          v-if="missingSpeakers.length > 0"
          class="mt-6"
          data-testid="speaker-import-missing-speakers-section">
          <div class="flex items-center gap-2 mb-3">
            <UIcon
              name="i-heroicons-archive-box"
              class="size-5" />
            <h3 class="text-lg font-semibold">
              {{ t("speakers.import.missingTitle") }}
            </h3>
          </div>

          <UAlert
            color="warning"
            variant="subtle"
            class="mb-4"
            data-testid="speaker-import-missing-alert">
            <template #description>
              {{ t("speakers.import.missingDescription") }}
            </template>
          </UAlert>

          <div class="space-y-3">
            <UCard
              v-for="(speaker, index) in missingSpeakers"
              :key="speaker.id"
              :data-testid="`speaker-import-missing-card-${index}`">
              <div class="flex items-start gap-3">
                <UCheckbox
                  v-model="speaker.selected"
                  :data-testid="`speaker-import-missing-checkbox-${index}`" />

                <div class="flex-1">
                  <div class="font-medium">{{ speaker.firstName }} {{ speaker.lastName }}</div>
                  <div class="text-sm text-muted">
                    {{ speaker.congregationName }}
                  </div>

                  <div
                    v-if="speaker.assignedTalks.length > 0"
                    class="mt-2 flex flex-wrap gap-1">
                    <span class="text-xs text-dimmed">
                      {{ t("speakers.import.assignedTalks") }}:
                    </span>
                    <UBadge
                      v-for="talkNo in speaker.assignedTalks"
                      :key="talkNo"
                      variant="subtle"
                      size="xs">
                      {{ talkNo }}
                    </UBadge>
                  </div>

                  <UAlert
                    v-if="speaker.scheduledTalksCount > 0"
                    color="warning"
                    variant="subtle"
                    size="xs"
                    class="mt-2"
                    :data-testid="`speaker-import-missing-scheduled-${index}`">
                    <template #description>
                      {{
                        t("speakers.import.scheduledTalks", { count: speaker.scheduledTalksCount })
                      }}
                    </template>
                  </UAlert>
                </div>
              </div>
            </UCard>
          </div>
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

  <!-- Manual Match Selection Modal -->
  <UModal
    v-model:open="manualMatchModalOpen"
    data-testid="speaker-import-manual-match-modal">
    <template #header>
      <h3
        class="text-lg font-semibold"
        data-testid="speaker-import-manual-match-title">
        {{ t("speakers.import.selectSpeaker") }}
      </h3>
    </template>

    <template #body>
      <UFormField :label="t('speakers.import.searchSpeaker')">
        <USelect
          v-model="selectedSpeakerForManualMatch"
          :items="
            speakerSearchResults.map(s => ({
              label: `${s.firstName} ${s.lastName} (${s.congregationName})${s.archived ? ' [' + t('speakers.archived') + ']' : ''}`,
              value: s.id,
            }))
          "
          searchable
          value-key="value"
          :placeholder="t('speakers.import.searchSpeaker')"
          data-testid="speaker-import-manual-match-select" />
      </UFormField>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="ghost"
        data-testid="speaker-import-manual-match-cancel"
        @click="close">
        {{ t("common.cancel") }}
      </UButton>

      <UButton
        :disabled="!selectedSpeakerForManualMatch"
        data-testid="speaker-import-manual-match-apply"
        @click="applyManualMatch">
        {{ t("common.apply") }}
      </UButton>
    </template>
  </UModal>
</template>
