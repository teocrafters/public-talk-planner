// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  compatibilityDate: "2025-10-04",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxtjs/i18n"],
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
  // Defaults are empty so a CI-built image carries no secrets; only NUXT_-prefixed
  // environment variables supply them at runtime, and .env is not read in production.
  runtimeConfig: {
    databaseUrl: "",
    cloudflareAccountId: "",
    cloudflareEmailToken: "",
    // Must be an address on a domain onboarded with Cloudflare Email Service, or every send is
    // rejected.
    emailFrom: "",
    // Not a secret: the default keeps local development working, and the container points it at
    // the job-files volume.
    jobFilesDir: ".data/job-files",
  },
  nitro: {
    preset: "node-server",
    experimental: {
      tasks: true,
    },
    compatibilityDate: "2025-10-04",
  },
})
