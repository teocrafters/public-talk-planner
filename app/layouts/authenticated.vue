<template>
  <div class="min-h-screen bg-background">
    <NuxtLoadingIndicator />
    <nav class="border-b border-default">
      <UContainer>
        <div class="flex items-center justify-between h-16">
          <div class="text-xl font-semibold text-default">
            {{ t("common.appTitle") }}
          </div>

          <div class="hidden md:flex items-center gap-6">
            <ULink
              to="/"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.dashboard") }}
            </ULink>

            <ULink
              v-if="canViewTalks"
              to="/talks"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.publicTalks") }}
            </ULink>

            <ULink
              v-if="canViewSpeakers"
              to="/speakers"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.speakers") }}
            </ULink>

            <ULink
              v-if="canViewPublishers"
              to="/publishers"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.publishers") }}
            </ULink>

            <ULink
              to="/meetings/list"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.meetings") }}
            </ULink>

            <UButton
              data-testid="logout-button"
              variant="ghost"
              @click="handleSignOut">
              {{ t("auth.signOut") }}
            </UButton>
          </div>

          <div class="md:hidden">
            <UDropdownMenu :items="menuItems">
              <UButton
                icon="i-heroicons-bars-3"
                variant="ghost" />
            </UDropdownMenu>
          </div>
        </div>
      </UContainer>
    </nav>

    <main class="py-6">
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { signOut } = useAuth()
  const { can, clearPermissionCache, fetchPermissions } = usePermissions()

  // Fetch permissions on SSR
  await fetchPermissions()

  // Permission checks for menu items
  const canViewTalks = computed(
    () =>
      can("talks", "create").value &&
      can("talks", "update").value &&
      can("talks", "archive").value &&
      can("talks", "flag").value
  )

  const canViewSpeakers = computed(() => can("speakers", "list").value)

  const canViewPublishers = computed(
    () => can("publishers", "create").value || can("publishers", "update").value
  )

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" })
    clearPermissionCache()
  }

  const menuItems = computed(() => {
    const items = [
      {
        label: t("navigation.dashboard"),
        to: "/",
        icon: "i-heroicons-home",
      },
    ]

    if (canViewTalks.value) {
      items.push({
        label: t("navigation.publicTalks"),
        to: "/talks",
        icon: "i-heroicons-document-text",
      })
    }

    if (canViewSpeakers.value) {
      items.push({
        label: t("navigation.speakers"),
        to: "/speakers",
        icon: "i-heroicons-user-group",
      })
    }

    if (canViewPublishers.value) {
      items.push({
        label: t("navigation.publishers"),
        to: "/publishers",
        icon: "i-heroicons-user-group",
      })
    }

    items.push({
      label: t("navigation.meetings"),
      to: "/meetings/list",
      icon: "i-heroicons-calendar-days",
    })

    return [
      items,
      [
        {
          label: t("auth.signOut"),
          icon: "i-heroicons-arrow-right-on-rectangle",
          onSelect: handleSignOut,
        },
      ],
    ]
  })
</script>
