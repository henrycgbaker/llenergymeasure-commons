import { describe, it, expect } from 'vitest';
import { toHeatmapData } from '../heatmapData.js';
import type { ExperimentResult, HeatmapCell } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as ExperimentResult[];

describe('toHeatmapData', () => {
	it('returns HeatmapCell[] with correct precision/batch_size/energy fields', () => {
		const cells = toHeatmapData(fixtures, 'pytorch', 'eager');
		expect(cells.length).toBeGreaterThan(0);
		for (const cell of cells) {
			expect(cell).toHaveProperty('precision');
			expect(cell).toHaveProperty('batch_size');
			expect(cell).toHaveProperty('energy');
			expect(cell).toHaveProperty('ratioVsBest');
			expect(cell).toHaveProperty('label');
			expect(typeof cell.precision).toBe('string');
			expect(typeof cell.batch_size).toBe('number');
			expect(typeof cell.energy).toBe('number');
		}
	});

	it('filters by backend+attention correctly (only matching records returned)', () => {
		const cells = toHeatmapData(fixtures, 'pytorch', 'eager');
		for (const cell of cells) {
			expect(cell.backend).toBe('pytorch');
			expect(cell.attn_implementation).toBe('eager');
		}
	});

	it('returns an empty array for non-matching backend+attention', () => {
		const cells = toHeatmapData(fixtures, 'nonexistent_backend', 'nonexistent_attn');
		expect(cells).toHaveLength(0);
	});

	it('ratioVsBest is 1.0 for the best cell, >1.0 for all others', () => {
		const cells = toHeatmapData(fixtures, 'pytorch', 'eager');
		expect(cells.length).toBeGreaterThan(1);
		const bestCells = cells.filter((c) => c.ratioVsBest === 1.0);
		expect(bestCells).toHaveLength(1);
		const otherCells = cells.filter((c) => c.ratioVsBest !== 1.0);
		for (const cell of otherCells) {
			expect(cell.ratioVsBest).toBeGreaterThan(1.0);
		}
	});

	it('worst/best energy ratio across all fixtures is >= 8x (NARR-03)', () => {
		// Use all backends/attns to find global worst/best
		const backends = [...new Set(fixtures.map((r) => r.backend))];
		const attns = [...new Set(fixtures.map((r) => r.effective_config.attn_implementation))];

		let allCells: HeatmapCell[] = [];
		for (const backend of backends) {
			for (const attn of attns) {
				const cells = toHeatmapData(fixtures, backend, attn);
				allCells = allCells.concat(cells);
			}
		}

		const energies = allCells.map((c) => c.energy);
		const minEnergy = Math.min(...energies);
		const maxEnergy = Math.max(...energies);
		const ratio = maxEnergy / minEnergy;
		expect(ratio).toBeGreaterThanOrEqual(8);
	});
});
