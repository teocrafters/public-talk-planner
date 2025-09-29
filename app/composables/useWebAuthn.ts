/**
 * Composable for WebAuthn (Passkey) functionality
 * Provides utilities for detecting browser support and managing passkey operations
 */
export function useWebAuthn() {
  // Check if WebAuthn is supported in the current browser
  const isSupported = computed(() => {
    if (typeof window === 'undefined') return false
    
    return !!(
      window.PublicKeyCredential && 
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    )
  })

  // Check if passkey setup has been completed (localStorage fallback)
  const isPasskeySetup = computed(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('passkey-setup-completed') === 'true'
  })

  // Check if prompt has been dismissed permanently
  const isPromptDismissed = computed(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('passkey-prompt-dismissed') === 'true'
  })

  // Mark passkey as setup completed
  const markPasskeySetup = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('passkey-setup-completed', 'true')
    }
  }

  // Dismiss prompt permanently
  const dismissPrompt = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('passkey-prompt-dismissed', 'true')
    }
  }

  // Set remind later timestamp
  const remindLater = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('passkey-remind-later', Date.now().toString())
    }
  }

  // Clear all passkey-related localStorage
  const clearPasskeyData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('passkey-setup-completed')
      localStorage.removeItem('passkey-prompt-dismissed')
      localStorage.removeItem('passkey-remind-later')
    }
  }

  return {
    isSupported: readonly(isSupported),
    isPasskeySetup: readonly(isPasskeySetup),
    isPromptDismissed: readonly(isPromptDismissed),
    markPasskeySetup,
    dismissPrompt,
    remindLater,
    clearPasskeyData
  }
}