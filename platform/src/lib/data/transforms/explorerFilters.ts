import type { ExperimentResult, ExplorerFilterState } from '../types.js';

export function applyExplorerFilters(
	results: ExperimentResult[],
	filters: ExplorerFilterState
): ExperimentResult[] {
	return results.filter((r) => {
		if (filters.backend !== null && r.backend !== filters.backend) return false;
		if (
			filters.attn !== null &&
			r.effective_config.attn_implementation !== filters.attn
		)
			return false;
		if (
			filters.precision !== null &&
			r.effective_config.precision !== filters.precision
		)
			return false;
		if (
			filters.batchSize !== null &&
			r.effective_config.batch_size !== filters.batchSize
		)
			return false;
		if (filters.energyRange !== null) {
			const [lo, hi] = filters.energyRange;
			if (r.avg_energy_per_token_j < lo || r.avg_energy_per_token_j > hi) return false;
		}
		if (filters.batchRange !== null) {
			const [lo, hi] = filters.batchRange;
			if (r.effective_config.batch_size < lo || r.effective_config.batch_size > hi)
				return false;
		}
		return true;
	});
}
