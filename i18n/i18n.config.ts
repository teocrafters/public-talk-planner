export default defineI18nConfig(() => ({
  legacy: false,
  locale: "pl",
  fallbackLocale: "pl",
  datetimeFormats: {
    pl: {
      short: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
      long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
      },
    },
    en: {
      short: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
      long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
      },
    },
  },
  numberFormats: {
    pl: {
      currency: {
        style: "currency",
        currency: "PLN",
      },
      decimal: {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
    en: {
      currency: {
        style: "currency",
        currency: "USD",
      },
      decimal: {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
  },
}))
