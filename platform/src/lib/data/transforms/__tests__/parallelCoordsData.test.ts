import { describe, it, expect } from 'vitest';
import { toParallelData } from '../parallelCoordsData.js';
import type { ExperimentResult } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as unknown as ExperimentResult[];

describe('toParallelData', () => {
	it('returns array of ParallelRecord with required fields', () => {
		const records = toParallelData(fixtures);
		expect(records.length).toBeGreaterThan(0);
		for (const r of records) {
			expect(r).toHaveProperty('experiment_id');
			expect(r).toHaveProperty('dimensions');
			expect(r).toHaveProperty('avg_energy_per_token_j');
			expect(typeof r.experiment_id).toBe('string');
			expect(typeof r.dimensions).toBe('object');
			expect(typeof r.avg_energy_per_token_j).toBe('number');
		}
	});

	it('handles all fixture records', () => {
		const records = toParallelData(fixtures);
		expect(records).toHaveLength(fixtures.length);
	});

	it('dimensions include backend and precision', () => {
		const records = toParallelData(fixtures);
		for (const r of records) {
			expect(r.dimensions).toHaveProperty('backend');
			expect(r.dimensions).toHaveProperty('precision');
		}
	});

	it('pytorch records have batch_size in dimensions', () => {
		const records = toParallelData(fixtures);
		const pytorch = records.filter((r) => r.dimensions.backend === 'pytorch');
		expect(pytorch.length).toBeGreaterThan(0);
		for (const r of pytorch) {
			expect(r.dimensions).toHaveProperty('batch_size');
			expect(typeof r.dimensions.batch_size).toBe('number');
		}
	});

	it('vllm records have enforce_eager in dimensions', () => {
		const records = toParallelData(fixtures);
		const vllm = records.filter((r) => r.dimensions.backend === 'vllm');
		expect(vllm.length).toBeGreaterThan(0);
		for (const r of vllm) {
			expect(r.dimensions).toHaveProperty('enforce_eager');
			expect(typeof r.dimensions.enforce_eager).toBe('boolean');
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
