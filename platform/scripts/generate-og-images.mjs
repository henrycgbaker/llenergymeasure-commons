/**
 * Generate branded OG preview cards for each chart slug.
 * Output: platform/static/og/{slug}-preview.png (1200x630 each)
 *
 * Uses sharp to convert an SVG template to PNG — no native Canvas required.
 * Run: node scripts/generate-og-images.mjs
 */

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'static', 'og');

const CHART_META = {
	heatmap: {
		title: 'Configuration Energy Heatmap',
		description: 'Energy per token across all model configurations'
	},
	timeseries: {
		title: 'Power Draw Over Time',
		description: 'Instantaneous GPU power draw during inference'
	},
	surface: {
		title: '3D Energy Surface',
		description: 'Energy landscape across precision × batch size'
	},
	pca: {
		title: 'PCA Configuration Projection',
		description: 'Configurations mapped to principal component space'
	},
	'parallel-coords': {
		title: 'Parallel Coordinates Explorer',
		description: 'All configuration dimensions with interactive brushing'
	}
};

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Escape XML special characters for SVG text content.
 */
function escapeXml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Generate an SVG card for a given slug.
 */
function buildSvg(slug, title, description) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a3a5c"/>
      <stop offset="100%" stop-color="#0d1f35"/>
    </linearGradient>
    <linearGradient id="accent-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2166ac"/>
      <stop offset="50%" stop-color="#f7f7f7"/>
      <stop offset="100%" stop-color="#d6604d"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Energy spectrum accent bar -->
  <rect x="60" y="460" width="1080" height="4" fill="url(#accent-line)" rx="2"/>

  <!-- llem-commons wordmark -->
  <text
    x="60"
    y="100"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="22"
    font-weight="400"
    fill="#74add1"
    letter-spacing="3"
  >llem-commons</text>

  <!-- Chart title -->
  <text
    x="60"
    y="200"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="52"
    font-weight="700"
    fill="#f8f6f2"
  >${escapeXml(title)}</text>

  <!-- Description -->
  <text
    x="60"
    y="270"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    font-size="26"
    font-weight="400"
    fill="#d0cfc9"
  >${escapeXml(description)}</text>

  <!-- Divider line -->
  <rect x="60" y="320" width="80" height="2" fill="#2166ac" rx="1"/>

  <!-- Subtitle: project context -->
  <text
    x="60"
    y="380"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    font-size="20"
    font-weight="400"
    fill="#8a9bb0"
  >AI Energy Efficiency Configuration Landscape</text>

  <!-- Attribution -->
  <text
    x="60"
    y="530"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    font-size="18"
    font-weight="400"
    fill="#74add1"
  >Henry Baker . Hertie School</text>

  <!-- Chart type badge -->
  <rect x="60" y="420" width="160" height="28" rx="14" fill="#1a3a5c" stroke="#2a5a8c" stroke-width="1"/>
  <text
    x="140"
    y="439"
    font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    font-size="13"
    font-weight="500"
    fill="#74add1"
    text-anchor="middle"
  >${escapeXml(slug.toUpperCase().replace('-', ' '))}</text>
</svg>`;
}

async function generate() {
	mkdirSync(OUT_DIR, { recursive: true });

	const entries = Object.entries(CHART_META);
	for (const [slug, { title, description }] of entries) {
		const svgBuffer = Buffer.from(buildSvg(slug, title, description), 'utf-8');
		const outPath = join(OUT_DIR, `${slug}-preview.png`);

		await sharp(svgBuffer)
			.resize(WIDTH, HEIGHT)
			.png({ quality: 90 })
			.toFile(outPath);

		console.log(`Generated: static/og/${slug}-preview.png`);
	}

	console.log(`\nDone — ${entries.length} OG images in platform/static/og/`);
}

generate().catch((err) => {
	console.error('OG image generation failed:', err);
	process.exit(1);
});
