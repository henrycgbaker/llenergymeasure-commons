import { describe, it, expect } from 'vitest';
import { applyExplorerFilters } from '../explorerFilters.js';
import type { ExperimentResult, ExplorerFilterState } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as unknown as ExperimentResult[];

const noFilters: ExplorerFilterState = {
	dimensionFilters: {},
	energyRange: null
};

describe('applyExplorerFilters', () => {
	it('returns all records when no filters set', () => {
		const result = applyExplorerFilters(fixtures, noFilters);
		expect(result).toHaveLength(fixtures.length);
	});

	it('filters by backend=pytorch correctly', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { backend: 'pytorch' },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.backend).toBe('pytorch');
		}
	});

	it('filters by precision=bf16 correctly', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { precision: 'bf16' },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.precision).toBe('bf16');
		}
	});

	it('filters by energyRange narrows to matching records', () => {
		const min = 0.01;
		const max = 0.05;
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: {},
			energyRange: [min, max]
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.avg_energy_per_token_j).toBeGreaterThanOrEqual(min);
			expect(r.avg_energy_per_token_j).toBeLessThanOrEqual(max);
		}
	});

	it('multiple filters combine with AND logic', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { backend: 'pytorch', precision: 'bf16' },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.backend).toBe('pytorch');
			expect(r.effective_config.precision).toBe('bf16');
		}
	});

	it('null filter values mean all (no filtering on that dimension)', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { backend: null },
			energyRange: null
		});
		expect(result).toHaveLength(fixtures.length);
	});

	it('filters by backend-specific dimension (attn_implementation)', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { attn_implementation: 'eager' },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.dimensions.attn_implementation).toBe('eager');
		}
	});

	it('filters by vllm-specific dimension (enforce_eager)', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { enforce_eager: true },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.dimensions.enforce_eager).toBe(true);
		}
	});

	it('filters by batch_size (exact match) correctly', () => {
		const result = applyExplorerFilters(fixtures, {
			dimensionFilters: { batch_size: 8 },
			energyRange: null
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.dimensions.batch_size).toBe(8);
		}
	});
});
