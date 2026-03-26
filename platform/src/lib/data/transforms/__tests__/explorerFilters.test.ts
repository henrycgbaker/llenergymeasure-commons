import { describe, it, expect } from 'vitest';
import { applyExplorerFilters } from '../explorerFilters.js';
import type { ExperimentResult, ExplorerFilterState } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as ExperimentResult[];

const noFilters: ExplorerFilterState = {
	backend: null,
	attn: null,
	precision: null,
	batchSize: null,
	energyRange: null,
	batchRange: null
};

describe('applyExplorerFilters', () => {
	it('returns all records when no filters set', () => {
		const result = applyExplorerFilters(fixtures, noFilters);
		expect(result).toHaveLength(fixtures.length);
	});

	it('filters by backend=pytorch correctly', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, backend: 'pytorch' });
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.backend).toBe('pytorch');
		}
	});

	it('filters by precision=bf16 correctly', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, precision: 'bf16' });
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.precision).toBe('bf16');
		}
	});

	it('filters by energyRange narrows to matching records', () => {
		const min = 0.01;
		const max = 0.05;
		const result = applyExplorerFilters(fixtures, {
			...noFilters,
			energyRange: [min, max]
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.avg_energy_per_token_j).toBeGreaterThanOrEqual(min);
			expect(r.avg_energy_per_token_j).toBeLessThanOrEqual(max);
		}
	});

	it('filters by batchRange=[1, 32] returns correct records', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, batchRange: [1, 32] });
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.batch_size).toBeGreaterThanOrEqual(1);
			expect(r.effective_config.batch_size).toBeLessThanOrEqual(32);
		}
	});

	it('multiple filters combine with AND logic', () => {
		const result = applyExplorerFilters(fixtures, {
			...noFilters,
			backend: 'pytorch',
			precision: 'bf16'
		});
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.backend).toBe('pytorch');
			expect(r.effective_config.precision).toBe('bf16');
		}
	});

	it('null filter values mean all (no filtering on that dimension)', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, backend: null });
		expect(result).toHaveLength(fixtures.length);
	});

	it('filters by attn implementation correctly', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, attn: 'eager' });
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.attn_implementation).toBe('eager');
		}
	});

	it('filters by batchSize (exact match) correctly', () => {
		const result = applyExplorerFilters(fixtures, { ...noFilters, batchSize: 8 });
		expect(result.length).toBeGreaterThan(0);
		for (const r of result) {
			expect(r.effective_config.batch_size).toBe(8);
		}
	});
});
