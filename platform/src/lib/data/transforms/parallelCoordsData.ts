import type { ExperimentResult, ParallelRecord } from '../types.js';

export function toParallelData(results: ExperimentResult[]): ParallelRecord[] {
	return results.map((r) => ({
		experiment_id: r.experiment_id,
		precision: r.effective_config.precision,
		batch_size: r.effective_config.batch_size,
		backend: r.backend,
		attn_implementation: r.effective_config.attn_implementation,
		avg_energy_per_token_j: r.avg_energy_per_token_j
	}));
}
