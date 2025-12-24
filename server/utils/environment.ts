/**
 * Environment detection utilities for server-side code
 * Auto-imported via Nuxt server utils
 *
 * Note: Nuxt overrides NODE_ENV to "development" during dev,
 * so we use custom environment variables for seeding control.
 */

/**
 * Get current seeding environment
 * - Returns 'staging' if NUXT_SEED_STAGING=1
 * - Returns 'production' if NODE_ENV=production
 * - Otherwise returns 'development'
 */
export function getNodeEnv(): string {
	// Check for staging flag first (since Nuxt overrides NODE_ENV)
	if (process.env.NUXT_SEED_STAGING === "1") {
		return "staging"
	}

	// Check actual NODE_ENV for production
	if (process.env.NODE_ENV === "production") {
		return "production"
	}

	return "development"
}

/**
 * Check if running in staging environment
 * Set NUXT_SEED_STAGING=1 to enable staging mode
 */
export function isStaging(): boolean {
	return process.env.NUXT_SEED_STAGING === "1"
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
	return process.env.NODE_ENV === "production"
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
	return !isStaging() && !isProduction()
}
