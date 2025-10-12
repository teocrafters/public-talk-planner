/**
 * Format 9-digit phone number to XXX-XXX-XXX format
 * @param digits - 9 digits (no formatting)
 * @returns formatted phone string
 */
export function formatPhoneNumber(digits: string): string {
	if (!digits || digits.length !== 9) {
		throw new Error("Phone number must be exactly 9 digits")
	}

	return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`
}

/**
 * Remove formatting from phone number
 * @param formatted - formatted phone (XXX-XXX-XXX)
 * @returns 9 digits only
 */
export function unformatPhoneNumber(formatted: string): string {
	return formatted.replace(/\D/g, "")
}
