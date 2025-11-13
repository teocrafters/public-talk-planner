<template>
  <div
    v-if="title || description"
    class="text-center mb-6">
    <h2
      v-if="title"
      class="text-2xl font-bold">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="mt-2 text-sm text-muted">
      {{ description }}
    </p>
  </div>

  <UForm
    :schema="registrationFormSchema"
    :state="formData"
    class="space-y-4"
    @submit="handleSubmit">
    <!-- First Name -->
    <UFormField
      :label="t('auth.firstName')"
      name="firstName"
      required>
      <UInput
        v-model="formData.firstName"
        type="text"
        :disabled="loading"
        class="w-full" />
    </UFormField>

    <!-- Last Name -->
    <UFormField
      :label="t('auth.lastName')"
      name="lastName"
      required>
      <UInput
        v-model="formData.lastName"
        type="text"
        :disabled="loading"
        class="w-full" />
    </UFormField>

    <!-- Email -->
    <UFormField
      :label="t('auth.emailAddress')"
      name="email"
      required>
      <UInput
        v-model="formData.email"
        type="email"
        :disabled="loading"
        class="w-full" />
    </UFormField>

    <!-- Password -->
    <UFormField
      :label="t('auth.password')"
      name="password"
      required>
      <UInput
        v-model="formData.password"
        type="password"
        :disabled="loading"
        class="w-full" />
    </UFormField>

    <!-- Confirm Password -->
    <UFormField
      :label="t('auth.confirmPassword')"
      name="confirmPassword"
      required>
      <UInput
        v-model="formData.confirmPassword"
        type="password"
        :disabled="loading"
        class="w-full" />
    </UFormField>

    <!-- Congregation Selection -->
    <UFormField
      :label="t('auth.congregation')"
      name="congregationId"
      required>
      <USelectMenu
        v-model="formData.congregationId"
        :items="congregations || []"
        :placeholder="t('auth.selectCongregation')"
        :disabled="loading || congregationsLoading"
        :loading="congregationsLoading"
        value-key="id"
        label-key="name"
        class="w-full" />
    </UFormField>

    <!-- Submit Button -->
    <UButton
      type="submit"
      block
      :loading="loading"
      :disabled="loading">
      {{ loading ? t("registration.registering") : t("auth.register") }}
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui"
  import { createRegistrationFormSchema } from "#shared/utils/schemas"

  defineProps<{
    title?: string
    description?: string
  }>()

  const emit = defineEmits<{
    submit: [data: RegistrationFormData]
  }>()

  const { t } = useI18n()

  // Create schema with translated messages
  const registrationFormSchema = createRegistrationFormSchema(t)

  // Form state
  const formData = reactive<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    congregationId: "",
  })

  const loading = ref(false)

  // Load congregations
  const { data: congregations, pending: congregationsLoading } =
    await useFetch<Congregation[]>("/api/congregations")

  // Submit handler with proper typing
  const handleSubmit = async (event: FormSubmitEvent<RegistrationFormData>) => {
    if (loading.value) return

    try {
      loading.value = true
      emit("submit", event.data)
    } catch (err) {
      console.error("Registration form submission error:", err)
    } finally {
      loading.value = false
    }
  }
</script>
