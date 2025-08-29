// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt()
// Your custom configs here
  .append({
    files: ["env.d.ts"],
    rules: {
      "no-var": "off",
    },
  })
  .append({
    rules: {
      "unicorn/filename-case": "off",
    },
  })
