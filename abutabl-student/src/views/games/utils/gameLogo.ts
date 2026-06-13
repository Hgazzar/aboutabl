/** Match legacy Blade: `<img src="/{{ $game->logo }}" />` or absolute URLs from API. */
export function gameLogoSrc(logo?: string | null, fallback = '/assets/games/images/animalTestImg.png'): string {
	if (!logo) return fallback;
	if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
	if (logo.startsWith('/')) return logo;
	return `/${logo}`;
}
