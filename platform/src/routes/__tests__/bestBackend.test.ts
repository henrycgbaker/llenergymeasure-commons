import { describe, it, expect } from 'vitest';
import type { ExperimentResult } from '$lib/data/types.js';
import fixtureData from '../../../static/data/fixture-results.json';
import { sortDimensionValues, getDimensionValues } from '$lib/data/dimensions.js';

const fixtures = fixtureData as unknown as ExperimentResult[];

/**
 * Replicates the bestBackend derivation from +page.ts load function.
 * This is a pure-function extraction of the logic so it can be unit tested
 * without needing to call SvelteKit's load() (which requires fetch mocking).
 */
function deriveBestBackend(allResults: ExperimentResult[]): string {
	const backends = sortDimensionValues(getDimensionValues(allResults, 'backend')) as string[];

	const deploymentData = backends.map((backend) => {
		const candidates = allResults.filter((r) => r.backend === backend);
		const best =
			candidates.reduce<ExperimentResult | null>(
				(acc, r) => (!acc || r.avg_energy_per_token_j < acc.avg_energy_per_token_j ? r : acc),
				null
			) ?? candidates[0];
		return {
			backend,
			energyPerToken: best?.avg_energy_per_token_j ?? 0
		};
	});

	return deploymentData.length > 0
		? deploymentData.reduce((a, b) => (a.energyPerToken < b.energyPerToken ? a : b)).backend
		: '';
}

describe('bestBackend derivation', () => {
	it('returns vllm as the best backend from real fixture data', () => {
		const best = deriveBestBackend(fixtures);
		expect(best).toBe('vllm');
	});

	it('returns the backend with lowest energy per token', () => {
		const backends = sortDimensionValues(getDimensionValues(fixtures, 'backend')) as string[];
		const deploymentData = backends.map((backend) => {
			const candidates = fixtures.filter((r) => r.backend === backend);
			const best =
				candidates.reduce<ExperimentResult | null>(
					(acc, r) => (!acc || r.avg_energy_per_token_j < acc.avg_energy_per_token_j ? r : acc),
					null
				) ?? candidates[0];
			return {
				backend,
				energyPerToken: best?.avg_energy_per_token_j ?? 0
			};
		});

		// vllm should have strictly lower energy than pytorch
		const vllmEntry = deploymentData.find((d) => d.backend === 'vllm');
		const pytorchEntry = deploymentData.find((d) => d.backend === 'pytorch');
		expect(vllmEntry).toBeDefined();
		expect(pytorchEntry).toBeDefined();
		expect(vllmEntry!.energyPerToken).toBeLessThan(pytorchEntry!.energyPerToken);
	});

	it('returns empty string for empty input', () => {
		const best = deriveBestBackend([]);
		expect(best).toBe('');
	});
});
