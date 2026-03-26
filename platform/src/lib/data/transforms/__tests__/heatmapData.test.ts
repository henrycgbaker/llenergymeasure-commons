import { describe, it, expect } from 'vitest';
import { toHeatmapData } from '../heatmapData.js';
import type { ExperimentResult } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as unknown as ExperimentResult[];

describe('toHeatmapData', () => {
	it('returns HeatmapCell[] with correct xValue/yValue/energy fields', () => {
		const cells = toHeatmapData(fixtures, { backend: 'pytorch' }, 'precision', 'batch_size');
		expect(cells.length).toBeGreaterThan(0);
		for (const cell of cells) {
			expect(cell).toHaveProperty('xValue');
			expect(cell).toHaveProperty('yValue');
			expect(cell).toHaveProperty('energy');
			expect(cell).toHaveProperty('ratioVsBest');
			expect(cell).toHaveProperty('label');
			expect(cell).toHaveProperty('dimensions');
			expect(typeof cell.xValue).toBe('string');
			expect(typeof cell.yValue).toBe('string');
			expect(typeof cell.energy).toBe('number');
		}
	});

	it('filters by dimension constraints correctly', () => {
		const cells = toHeatmapData(
			fixtures,
			{ backend: 'pytorch', attn_implementation: 'eager' },
			'precision',
			'batch_size'
		);
		for (const cell of cells) {
			expect(cell.dimensions.backend).toBe('pytorch');
			expect(cell.dimensions.attn_implementation).toBe('eager');
		}
	});

	it('returns an empty array for non-matching filters', () => {
		const cells = toHeatmapData(fixtures, { backend: 'nonexistent' }, 'precision', 'batch_size');
		expect(cells).toHaveLength(0);
	});

	it('ratioVsBest is 1.0 for the best cell, >1.0 for all others', () => {
		const cells = toHeatmapData(
			fixtures,
			{ backend: 'pytorch', attn_implementation: 'eager' },
			'precision',
			'batch_size'
		);
		expect(cells.length).toBeGreaterThan(1);
		const bestCells = cells.filter((c) => c.ratioVsBest === 1.0);
		expect(bestCells).toHaveLength(1);
		const otherCells = cells.filter((c) => c.ratioVsBest !== 1.0);
		for (const cell of otherCells) {
			expect(cell.ratioVsBest).toBeGreaterThan(1.0);
		}
	});

	it('global worst/best energy ratio across all results is significant', () => {
		const energies = fixtures.map((r) => r.avg_energy_per_token_j);
		const minEnergy = Math.min(...energies);
		const maxEnergy = Math.max(...energies);
		const ratio = maxEnergy / minEnergy;
		// Real data has ~60x range; assert at least 2x to be robust
		expect(ratio).toBeGreaterThanOrEqual(2);
	});

	it('works with vllm backend and its native dimensions', () => {
		const cells = toHeatmapData(
			fixtures,
			{ backend: 'vllm' },
			'enforce_eager',
			'max_num_seqs'
		);
		expect(cells.length).toBeGreaterThan(0);
		for (const cell of cells) {
			expect(cell.dimensions.backend).toBe('vllm');
		}
	});
});
