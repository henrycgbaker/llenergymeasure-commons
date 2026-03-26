import type { ExperimentResult, ParallelRecord } from '../types.js';
import { getAllDimensions } from '../dimensions.js';

/**
 * Extract dimension data for parallel coordinates visualisation.
 * If dimensionKeys is provided, only those keys are included;
 * otherwise all dimensions are auto-discovered from the results.
 */
export function toParallelData(
	results: ExperimentResult[],
	dimensionKeys?: string[]
): ParallelRecord[] {
	return results.map((r) => {
		const all = getAllDimensions(r);
		const dims = dimensionKeys
			? Object.fromEntries(dimensionKeys.filter((k) => k in all).map((k) => [k, all[k]]))
			: all;
		return {
			experiment_id: r.experiment_id,
			dimensions: dims,
			avg_energy_per_token_j: r.avg_energy_per_token_j
		};
	});
}
