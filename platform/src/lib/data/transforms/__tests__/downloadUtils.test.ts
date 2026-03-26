import { describe, it, expect } from 'vitest';
import { toCSV, toJSON } from '../downloadUtils.js';
import type { ExperimentResult } from '../../types.js';
import fixtureData from '../../../../../static/data/fixture-results.json';

const fixtures = fixtureData as unknown as ExperimentResult[];

describe('toCSV', () => {
	it('produces string with header row + data rows matching input count', () => {
		const csv = toCSV(fixtures);
		const lines = csv.trim().split('\n');
		// 1 header + N data rows
		expect(lines).toHaveLength(fixtures.length + 1);
	});

	it('header includes backend, precision, energy and throughput columns', () => {
		const csv = toCSV(fixtures);
		const header = csv.split('\n')[0];
		expect(header).toContain('backend');
		expect(header).toContain('precision');
		expect(header).toContain('energy_j_per_token');
		expect(header).toContain('throughput_tok_s');
	});

	it('row count matches input', () => {
		const subset = fixtures.slice(0, 10);
		const csv = toCSV(subset);
		const lines = csv.trim().split('\n');
		expect(lines).toHaveLength(11); // 1 header + 10 data
	});

	it('handles commas in values by quoting', () => {
		const record = {
			...fixtures[0],
			backend: 'my,backend'
		} as ExperimentResult;
		const csv = toCSV([record]);
		const dataLine = csv.split('\n')[1];
		expect(dataLine).toContain('"my,backend"');
	});

	it('data values are present and non-empty', () => {
		const csv = toCSV(fixtures.slice(0, 5));
		const lines = csv.trim().split('\n');
		for (const line of lines.slice(1)) {
			expect(line.length).toBeGreaterThan(0);
		}
	});
});

describe('toJSON', () => {
	it('produces valid JSON string that parses back to an array', () => {
		const json = toJSON(fixtures);
		const parsed = JSON.parse(json);
		expect(Array.isArray(parsed)).toBe(true);
	});

	it('parsed array length matches input', () => {
		const json = toJSON(fixtures);
		const parsed = JSON.parse(json);
		expect(parsed).toHaveLength(fixtures.length);
	});

	it('parsed records contain backend, precision, and energy fields', () => {
		const json = toJSON(fixtures.slice(0, 3));
		const parsed = JSON.parse(json);
		for (const r of parsed) {
			expect(r).toHaveProperty('backend');
			expect(r).toHaveProperty('precision');
			expect(r).toHaveProperty('energy_j_per_token');
			expect(r).toHaveProperty('throughput_tok_s');
		}
	});
});
