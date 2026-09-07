export function figmaSidebarIconUrl(fileName: string): string {
	return new URL(`../assets/images/figma/sidebar/${fileName}`, import.meta.url).href;
}

export function figmaDashboardAssetUrl(fileName: string): string {
	return new URL(`../assets/images/figma/dashboard/${fileName}`, import.meta.url).href;
}

export function figmaNavbarAssetUrl(fileName: string): string {
	return new URL(`../assets/images/figma/navbar/${fileName}`, import.meta.url).href;
}

export function figmaProfileAssetUrl(fileName: string): string {
	return new URL(`../assets/images/figma/profile/${fileName}`, import.meta.url).href;
}

export function figmaMyProgressAssetUrl(fileName: string): string {
	return new URL(`../assets/images/figma/my-progress/${fileName}`, import.meta.url).href;
}
