import type { ExperimentResult, HeatmapCell } from '../types.js';

/**
 * Converts raw ExperimentResult records into typed HeatmapCell data
 * filtered by backend and attention implementation.
 *
 * Returns cells sorted by energy descending (worst to best)
 * for progressive reveal in the scroll narrative.
 */
export function toHeatmapData(
	results: ExperimentResult[],
	backend: string,
	attn: string
): HeatmapCell[] {
	const filtered = results.filter(
		(r) => r.backend === backend && r.effective_config.attn_implementation === attn
	);

	if (filtered.length === 0) return [];

	const minEnergy = Math.min(...filtered.map((r) => r.avg_energy_per_token_j));

	const cells: HeatmapCell[] = filtered.map((r) => ({
		precision: r.effective_config.precision,
		batch_size: r.effective_config.batch_size,
		backend: r.backend,
		attn_implementation: r.effective_config.attn_implementation,
		energy: r.avg_energy_per_token_j,
		throughput: r.avg_tokens_per_second,
		total_energy_j: r.total_energy_j,
		ratioVsBest: r.avg_energy_per_token_j / minEnergy,
		label: `${r.effective_config.precision}, batch ${r.effective_config.batch_size}`
	}));

	// Sort by energy descending so worst cell appears first
	cells.sort((a, b) => b.energy - a.energy);

	return cells;
}
