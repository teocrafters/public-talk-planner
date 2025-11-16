/**
 * Composable for managing SEO meta tags using i18n translations.
 *
 * @example
 * // In a page component
 * useSeoPage("auth.signIn")
 * useSeoPage("dashboard")
 * useSeoPage("talks.list")
 * useSeoPage("meetings.list")
 */
export function useSeoPage(pageKey: string) {
	const { t } = useI18n()

	useSeoMeta({
		title: t(`seo.${pageKey}.title`),
		description: t(`seo.${pageKey}.description`),
		ogTitle: t(`seo.${pageKey}.ogTitle`),
		ogDescription: t(`seo.${pageKey}.ogDescription`),
		ogImage: t(`seo.${pageKey}.ogImage`),
	})
}
