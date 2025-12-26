/**
 * Composable for safely overriding color mode with automatic restoration
 *
 * Use case: Temporarily force a specific color mode (e.g., light mode for print)
 * while preserving the user's original preference for restoration.
 *
 * @example
 * ```typescript
 * const { forceColorMode } = usePreserveColorMode()
 * forceColorMode("light") // Override to light mode
 * // Cleanup happens automatically via onScopeDispose
 * ```
 */
export function usePreserveColorMode() {
	const colorMode = useColorMode()
	let originalPreference: string | null = null

	/**
	 * Force a specific color mode, storing the original preference for later restoration
	 */
	const forceColorMode = (mode: "light" | "dark") => {
		// Store original preference only once (on first call)
		if (originalPreference === null) {
			originalPreference = colorMode.preference
		}
		colorMode.preference = mode
	}

	/**
	 * Restore the original color mode preference
	 */
	const restoreColorMode = () => {
		if (originalPreference !== null) {
			colorMode.preference = originalPreference
			originalPreference = null // Reset state
		}
	}

	// Automatic cleanup when component scope is disposed
	// This is more reliable than onUnmounted for Nuxt SSR context
	onScopeDispose(() => {
		restoreColorMode()
	})

	return {
		forceColorMode,
		restoreColorMode,
	}
}
