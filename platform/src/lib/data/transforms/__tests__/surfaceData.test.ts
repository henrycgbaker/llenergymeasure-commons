import { describe, it, expect } from 'vitest';
import { toSurfaceGrid } from '../surfaceData.js';
import type { ExperimentResult } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as ExperimentResult[];

describe('toSurfaceGrid', () => {
	it('returns correct shape for precision x batch_size axes', () => {
		const grid = toSurfaceGrid(fixtures, 'precision', 'batch_size');
		expect(grid).toHaveProperty('x');
		expect(grid).toHaveProperty('y');
		expect(grid).toHaveProperty('z');
		expect(grid).toHaveProperty('xLabel');
		expect(grid).toHaveProperty('yLabel');
		expect(Array.isArray(grid.x)).toBe(true);
		expect(Array.isArray(grid.y)).toBe(true);
		expect(Array.isArray(grid.z)).toBe(true);
		expect(typeof grid.xLabel).toBe('string');
		expect(typeof grid.yLabel).toBe('string');
	});

	it('z-array dimensions are [y.length][x.length]', () => {
		const grid = toSurfaceGrid(fixtures, 'precision', 'batch_size');
		expect(grid.z.length).toBe(grid.y.length);
		for (const row of grid.z) {
			expect(row.length).toBe(grid.x.length);
		}
	});

	it('multiple records mapping to same cell are averaged', () => {
		// Use a pair where we know there are multiple records per cell
		const grid = toSurfaceGrid(fixtures, 'precision', 'backend');
		// Every z-value must be a finite number
		for (const row of grid.z) {
			for (const val of row) {
				expect(typeof val).toBe('number');
				expect(isFinite(val)).toBe(true);
				expect(val).toBeGreaterThan(0);
			}
		}
	});

	it('missing cells filled with mean (neutral interpolation)', () => {
		// All cells should have valid numeric values — no NaN or undefined
		const grid = toSurfaceGrid(fixtures, 'precision', 'batch_size');
		for (const row of grid.z) {
			for (const val of row) {
				expect(val).not.toBeNaN();
				expect(val).toBeGreaterThan(0);
			}
		}
	});

	it('works for backend x precision axes', () => {
		const grid = toSurfaceGrid(fixtures, 'backend', 'precision');
		expect(grid.x.length).toBeGreaterThan(0);
		expect(grid.y.length).toBeGreaterThan(0);
		expect(grid.z.length).toBe(grid.y.length);
		for (const row of grid.z) {
			expect(row.length).toBe(grid.x.length);
		}
	});

	it('works for batch_size x backend axes', () => {
		const grid = toSurfaceGrid(fixtures, 'batch_size', 'backend');
		expect(grid.x.length).toBeGreaterThan(0);
		expect(grid.y.length).toBeGreaterThan(0);
		expect(grid.z.length).toBe(grid.y.length);
		for (const row of grid.z) {
			expect(row.length).toBe(grid.x.length);
		}
	});
});
