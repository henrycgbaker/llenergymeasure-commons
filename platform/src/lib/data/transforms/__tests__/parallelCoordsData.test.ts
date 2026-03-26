import { describe, it, expect } from 'vitest';
import { toParallelData } from '../parallelCoordsData.js';
import type { ExperimentResult } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as ExperimentResult[];

describe('toParallelData', () => {
	it('returns array of ParallelRecord with required fields', () => {
		const records = toParallelData(fixtures);
		expect(records.length).toBeGreaterThan(0);
		for (const r of records) {
			expect(r).toHaveProperty('experiment_id');
			expect(r).toHaveProperty('precision');
			expect(r).toHaveProperty('batch_size');
			expect(r).toHaveProperty('backend');
			expect(r).toHaveProperty('attn_implementation');
			expect(r).toHaveProperty('avg_energy_per_token_j');
		}
	});

	it('handles all 180 fixture records', () => {
		const records = toParallelData(fixtures);
		expect(records).toHaveLength(180);
	});

	it('categorical fields are strings, numeric fields are numbers', () => {
		const records = toParallelData(fixtures);
		for (const r of records) {
			expect(typeof r.precision).toBe('string');
			expect(typeof r.backend).toBe('string');
			expect(typeof r.attn_implementation).toBe('string');
			expect(typeof r.experiment_id).toBe('string');
			expect(typeof r.batch_size).toBe('number');
			expect(typeof r.avg_energy_per_token_j).toBe('number');
		}
	});

	it('experiment_id matches source records', () => {
		const records = toParallelData(fixtures);
		const fixtureIds = new Set(fixtures.map((f) => f.experiment_id));
		for (const r of records) {
			expect(fixtureIds.has(r.experiment_id)).toBe(true);
		}
	});
});
