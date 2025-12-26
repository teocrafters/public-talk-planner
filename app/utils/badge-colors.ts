/**
 * Utility to create custom badge color overrides using Tailwind colors
 * instead of semantic color aliases
 */

type BadgeVariant = "solid" | "outline" | "soft" | "subtle"

const colorMap = {
	green: {
		solid: "bg-green-600 text-white",
		outline: "text-green-600 ring ring-inset ring-green-600/50",
		soft: "bg-green-600/10 text-green-600",
		subtle: "bg-green-600/10 text-green-600 ring ring-inset ring-green-600/25",
	},
	blue: {
		solid: "bg-blue-600 text-white",
		outline: "text-blue-600 ring ring-inset ring-blue-600/50",
		soft: "bg-blue-600/10 text-blue-600",
		subtle: "bg-blue-600/10 text-blue-600 ring ring-inset ring-blue-600/25",
	},
	red: {
		solid: "bg-red-600 text-white",
		outline: "text-red-600 ring ring-inset ring-red-600/50",
		soft: "bg-red-600/10 text-red-600",
		subtle: "bg-red-600/10 text-red-600 ring ring-inset ring-red-600/25",
	},
	yellow: {
		solid: "bg-yellow-500 text-white",
		outline: "text-yellow-600 ring ring-inset ring-yellow-500/50",
		soft: "bg-yellow-500/10 text-yellow-600",
		subtle: "bg-yellow-500/10 text-yellow-600 ring ring-inset ring-yellow-500/25",
	},
	gray: {
		solid: "bg-gray-600 text-white",
		outline: "text-gray-600 ring ring-inset ring-gray-600/50",
		soft: "bg-gray-600/10 text-gray-600",
		subtle: "bg-gray-600/10 text-gray-600 ring ring-inset ring-gray-600/25",
	},
	purple: {
		solid: "bg-purple-600 text-white",
		outline: "text-purple-600 ring ring-inset ring-purple-600/50",
		soft: "bg-purple-600/10 text-purple-600",
		subtle: "bg-purple-600/10 text-purple-600 ring ring-inset ring-purple-600/25",
	},
}

export function getBadgeColorUI(
	color: keyof typeof colorMap,
	variant: BadgeVariant = "subtle"
) {
	return {
		base: colorMap[color][variant],
	}
}

/**
 * Utility to create custom chip color overrides using Tailwind colors
 */
const chipColorMap = {
	green: "bg-green-600",
	blue: "bg-blue-600",
	red: "bg-red-600",
	yellow: "bg-yellow-500",
	gray: "bg-gray-600",
	purple: "bg-purple-600",
}

export function getChipColorUI(color: keyof typeof chipColorMap) {
	return {
		base: chipColorMap[color],
	}
}
