import { describe, it, expect } from 'vitest';
import { smartphoneCharges, formatEquivalence } from '../equivalences.js';

describe('smartphoneCharges', () => {
	it('returns approximately 528 for energy 0.01782 J/token at 128 tokens/query and 10M queries/month', () => {
		const result = smartphoneCharges(0.01782, 128, 10_000_000);
		// Expected: 0.01782 * 128 * 10_000_000 / 43200 ≈ 528
		expect(result).toBeCloseTo(528, -1); // within ±5 of 528
	});

	it('returns approximately 63 for energy 0.00214 J/token at 128 tokens/query and 10M queries/month', () => {
		const result = smartphoneCharges(0.00214, 128, 10_000_000);
		// Expected: 0.00214 * 128 * 10_000_000 / 43200 ≈ 63
		expect(result).toBeCloseTo(63, -1); // within ±5 of 63
	});

	it('uses default tokensPerQuery=128 and queriesPerMonth=10_000_000', () => {
		const withDefaults = smartphoneCharges(0.01782);
		const explicit = smartphoneCharges(0.01782, 128, 10_000_000);
		expect(withDefaults).toBe(explicit);
	});

	it('returns an integer (Math.round result)', () => {
		const result = smartphoneCharges(0.01782, 128, 10_000_000);
		expect(Number.isInteger(result)).toBe(true);
	});
});

describe('formatEquivalence', () => {
	it('returns a human-readable string with the number', () => {
		const result = formatEquivalence(528);
		expect(typeof result).toBe('string');
		expect(result).toContain('528');
	});

	it('returns a string containing "smartphone" or similar context word', () => {
		const result = formatEquivalence(100);
		expect(result.toLowerCase()).toMatch(/smartphone/);
	});
});
