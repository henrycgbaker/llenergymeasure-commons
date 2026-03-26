import { describe, it, expect } from 'vitest';
import { CHART_SLUGS, CHART_META } from '../chartMeta.js';

describe('CHART_SLUGS', () => {
	it('is a readonly tuple of exactly 5 slugs', () => {
		expect(CHART_SLUGS).toHaveLength(5);
	});

	it('contains exactly the expected slugs', () => {
		expect([...CHART_SLUGS]).toEqual([
			'heatmap',
			'timeseries',
			'surface',
			'pca',
			'parallel-coords'
		]);
	});
});

describe('CHART_META', () => {
	it('has an entry for every slug in CHART_SLUGS', () => {
		for (const slug of CHART_SLUGS) {
			expect(CHART_META).toHaveProperty(slug);
		}
	});

	it('has no extra keys beyond the slugs', () => {
		const metaKeys = Object.keys(CHART_META).sort();
		const slugKeys = [...CHART_SLUGS].sort();
		expect(metaKeys).toEqual(slugKeys);
	});

	it('every entry has a non-empty title', () => {
		for (const slug of CHART_SLUGS) {
			expect(CHART_META[slug].title.length).toBeGreaterThan(0);
		}
	});

	it('every entry has a non-empty description', () => {
		for (const slug of CHART_SLUGS) {
			expect(CHART_META[slug].description.length).toBeGreaterThan(0);
		}
	});

	it('every entry has a non-empty altText', () => {
		for (const slug of CHART_SLUGS) {
			expect(CHART_META[slug].altText.length).toBeGreaterThan(0);
		}
	});

	it('altText for each chart is at least 50 characters', () => {
		for (const slug of CHART_SLUGS) {
			expect(CHART_META[slug].altText.length).toBeGreaterThanOrEqual(50);
		}
	});
});
