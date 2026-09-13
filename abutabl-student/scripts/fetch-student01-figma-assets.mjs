/**
 * Export STUDENT-01 Dashboard + Shell assets from Figma REST API.
 * Usage: FIGMA_ACCESS_TOKEN=<token> node scripts/fetch-student01-figma-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_KEY = 'xh6FoPgdh33xPffuxPkpGY';
const TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(__dirname, '../src/assets/images/figma');

const ASSETS = [
	{ nodeId: '1409:1114', rel: 'auth/bird-book-2.png', label: 'bird-book-2 1 (login)' },
	{ nodeId: '857:785', rel: 'sidebar/house-shop-3.png', label: 'House Shop 3 (Dashboard)' },
	{ nodeId: '857:789', rel: 'sidebar/award-badge-1.png', label: 'Award Badge 1 (Progress)' },
	{ nodeId: '857:792', rel: 'sidebar/todo-1.png', label: 'todo 1 (To Do)' },
	{ nodeId: '857:795', rel: 'sidebar/book-1.png', label: 'Book 1 (Books)' },
	{ nodeId: '857:798', rel: 'sidebar/puzzle-1.png', label: 'Puzzle 1 (Games)' },
	{ nodeId: '857:801', rel: 'sidebar/crown-1-2.png', label: 'Crown-1 2 (Leaderboard)' },
	{ nodeId: '1960:1475', rel: 'dashboard/star-6-1.png', label: 'Star 6 1' },
	{ nodeId: '1960:1500', rel: 'dashboard/achiever-badge.png', label: 'image 14 Achiever' },
	{ nodeId: '1895:1449', rel: 'dashboard/bomb-explode-5.png', label: 'Bomb Explode 5 (streak)' },
	{ nodeId: '1895:1481', rel: 'dashboard/treasure-box.png', label: 'wooden-treasure-box' },
	{ nodeId: '1583:1414', rel: 'dashboard/social-icons.png', label: 'socialIcons' },
	{ nodeId: '147:541', rel: 'navbar/navBar.png', label: 'navBar component' },
	{ nodeId: '1960:1475', rel: 'navbar/star-6-1.png', label: 'Star 6 1 (navbar XP)' },
	// Logo + bell: export from navBar symbol 147:541 children or provide manually
	// Avatar ring + presets: copy from Downloads/student-figma-assets → navbar/ellipse-649.svg, navbar/avatars/*
];

if (!TOKEN) {
	console.error('Missing FIGMA_ACCESS_TOKEN or FIGMA_TOKEN');
	process.exit(1);
}

const ids = ASSETS.map((a) => encodeURIComponent(a.nodeId)).join(',');
const imagesRes = await fetch(
	`https://api.figma.com/v1/images/${FILE_KEY}?ids=${ids}&format=png&scale=2`,
	{ headers: { 'X-Figma-Token': TOKEN } }
);
const imagesJson = await imagesRes.json();
if (!imagesRes.ok) {
	console.error('Figma images API error:', imagesJson);
	process.exit(1);
}

for (const asset of ASSETS) {
	const url = imagesJson.images?.[asset.nodeId];
	if (!url) {
		console.error(`No export URL for ${asset.label} (${asset.nodeId})`);
		process.exit(1);
	}
	const outPath = path.join(OUT_ROOT, asset.rel);
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	const imgRes = await fetch(url);
	if (!imgRes.ok) {
		console.error(`Failed to download ${asset.label}`);
		process.exit(1);
	}
	fs.writeFileSync(outPath, Buffer.from(await imgRes.arrayBuffer()));
	console.log(`OK ${asset.rel}`);
}

console.log('All STUDENT-01 Figma assets exported.');
