import { figmaDashboardAssetUrl } from 'config/figmaAssets';

export type SubjectHeroTheme = 'math' | 'science' | 'default';

const MATH_RE =
	/\b(math|maths|mathematics|algebra|geometry|arithmetic)\b|رياض|حساب|جبر|هندس/i;
const SCIENCE_RE =
	/\b(science|scientist|biology|chemistry|physics|stem)\b|علوم|أحياء|كيمياء|فيزياء/i;

/**
 * Pick learn-details hero art from the subject/book title.
 * Math → orange explorer banner; Science → purple banner; else default gradient.
 */
export function resolveSubjectHeroTheme(title: string | null | undefined): SubjectHeroTheme {
	const name = (title ?? '').trim();
	if (!name) return 'default';
	if (MATH_RE.test(name)) return 'math';
	if (SCIENCE_RE.test(name)) return 'science';
	return 'default';
}

export function subjectHeroBannerUrl(theme: SubjectHeroTheme): string | null {
	if (theme === 'math') return figmaDashboardAssetUrl('learn-subject-hero-math.png');
	if (theme === 'science') return figmaDashboardAssetUrl('learn-subject-hero-science.png');
	return null;
}
