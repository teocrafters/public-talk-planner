export default defineTask({
  meta: {
    name: "db:seed",
    description: "Run database seed task",
  },
  async run() {
    console.log("Running DB seed task...")

    return { result: "success" }
  },
})
