import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		video: "retain-on-failure",
		screenshot: "only-on-failure",
	},

	projects: [
		// Setup project - runs first
		{
			name: "setup",
			testMatch: /setup\/server\.ts/,
		},

		// Auth setup projects - depend on setup
		{
			name: "auth",
			testMatch: /setup\/auth\.ts/,
			dependencies: ["setup"],
		},

		// Test projects - depend on auth
		{
			name: "desktop",
			testMatch: /.*\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 720 },
			},
			dependencies: ["auth"],
		},
		{
			name: "mobile",
			testMatch: /.*\.spec\.ts/,
			use: {
				...devices["iPhone 14"],
			},
			dependencies: ["auth"],
    },

    // Teardown project - runs last
    {
      name: "teardown",
      testMatch: /setup\/teardown\.ts/,
      dependencies: ["setup", "desktop", "mobile"],
    },
	],
})
