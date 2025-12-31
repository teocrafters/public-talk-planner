// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  compatibilityDate: "2025-10-04",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxthub/core", "@nuxtjs/i18n"],
  // ssr: false,
  i18n: {
    defaultLocale: "pl",
    locales: [
      {
        code: "pl",
        name: "Polski",
        file: "pl.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
      alwaysRedirect: false,
      fallbackLocale: "pl",
    },
  },
  hub: {
    cache: true,
    database: true,
    kv: true,
  },
  nitro: {
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    experimental: {
      tasks: true,
    },
    compatibilityDate: "2025-10-04",
  },
})
