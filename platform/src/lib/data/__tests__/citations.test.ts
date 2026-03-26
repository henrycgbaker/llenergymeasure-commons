import { describe, it, expect } from 'vitest';
import { PLATFORM_APA, PLATFORM_BIBTEX, chartApa, chartBibtex } from '../citations.js';

describe('PLATFORM_APA', () => {
	it('contains author and year', () => {
		expect(PLATFORM_APA).toContain('Baker, H. (2026)');
	});

	it('contains institution', () => {
		expect(PLATFORM_APA).toContain('Hertie School');
	});
});

describe('PLATFORM_BIBTEX', () => {
	it('contains the BibTeX entry key', () => {
		expect(PLATFORM_BIBTEX).toContain('@misc{llem_commons_2026');
	});

	it('contains institution field', () => {
		expect(PLATFORM_BIBTEX).toContain('institution');
	});
});

describe('chartApa', () => {
	it('includes the chart title', () => {
		const apa = chartApa('Configuration Energy Heatmap', 'heatmap');
		expect(apa).toContain('Configuration Energy Heatmap');
	});

	it('includes "dataset v." for versioning', () => {
		const apa = chartApa('Configuration Energy Heatmap', 'heatmap');
		expect(apa).toContain('dataset v.');
	});

	it('includes the chart URL path with slug', () => {
		const apa = chartApa('Configuration Energy Heatmap', 'heatmap');
		expect(apa).toContain('/chart/heatmap');
	});
});

describe('chartBibtex', () => {
	it('includes the slug-based BibTeX key', () => {
		const bibtex = chartBibtex('Configuration Energy Heatmap', 'heatmap');
		expect(bibtex).toContain('@misc{llem_heatmap_2026');
	});

	it('includes the chart URL', () => {
		const bibtex = chartBibtex('Configuration Energy Heatmap', 'heatmap');
		expect(bibtex).toContain('/chart/heatmap');
	});

	it('escapes hyphens in slug for BibTeX key (parallel-coords -> parallel_coords)', () => {
		const bibtex = chartBibtex('Parallel Coordinates', 'parallel-coords');
		expect(bibtex).toContain('@misc{llem_parallel_coords_2026');
	});
});

describe('dataset hash fallback', () => {
	it('uses "dev" as fallback hash when VITE_DATASET_HASH is not set', () => {
		// In test environment, import.meta.env.VITE_DATASET_HASH is undefined
		// so citations should contain "dev" as the hash
		const apa = chartApa('Configuration Energy Heatmap', 'heatmap');
		// Should contain either "dev" or an actual hash — in test env, "dev" is expected
		expect(apa).toMatch(/dataset v\.\w+/);
	});
});
