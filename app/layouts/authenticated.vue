<template>
  <div class="min-h-screen bg-background">
    <nav class="border-b border-default">
      <UContainer>
        <div class="flex items-center justify-between h-16">
          <div class="text-xl font-semibold text-default">
            {{ t("common.appTitle") }}
          </div>

          <div class="hidden md:flex items-center gap-6">
            <ULink
              to="/user"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.dashboard") }}
            </ULink>

            <ULink
              to="/talks"
              active-class="text-primary"
              inactive-class="text-muted hover:text-default">
              {{ t("navigation.publicTalks") }}
            </ULink>

            <UButton
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

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/" })
  }

  const menuItems = [
    [
      {
        label: t("navigation.dashboard"),
        to: "/user",
        icon: "i-heroicons-home",
      },
      {
        label: t("navigation.publicTalks"),
        to: "/talks",
        icon: "i-heroicons-document-text",
      },
    ],
    [
      {
        label: t("auth.signOut"),
        icon: "i-heroicons-arrow-right-on-rectangle",
        click: handleSignOut,
      },
    ],
  ]
</script>
