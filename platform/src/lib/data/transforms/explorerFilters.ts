import type { ExperimentResult, ExplorerFilterState } from '../types.js';
import { getDimension } from '../dimensions.js';

export function applyExplorerFilters(
	results: ExperimentResult[],
	filters: ExplorerFilterState
): ExperimentResult[] {
	return results.filter((r) => {
		// Check each dimension filter
		for (const [key, value] of Object.entries(filters.dimensionFilters)) {
			if (value === null) continue;
			const actual = getDimension(r, key);
			if (actual === undefined || actual !== value) return false;
		}
		// Energy range filter
		if (filters.energyRange !== null) {
			const [lo, hi] = filters.energyRange;
			if (r.avg_energy_per_token_j < lo || r.avg_energy_per_token_j > hi) return false;
		}
		return true;
	});
}
