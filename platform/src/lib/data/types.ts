export interface EffectiveConfig {
	model: string;
	backend: string;
	precision: string;
	batch_size: number;
	attn_implementation: string;
	load_in_8bit: boolean;
	n: number;
	max_input_tokens: number;
	max_output_tokens: number;
}

export interface ExperimentResult {
	schema_version: string;
	experiment_id: string;
	measurement_config_hash: string | null;
	backend: string;
	backend_version: string | null;
	measurement_methodology: string | null;
	steady_state_window: number | null;
	total_tokens: number;
	total_energy_j: number;
	total_inference_time_sec: number;
	avg_tokens_per_second: number;
	avg_energy_per_token_j: number;
	total_flops: number;
	flops_per_output_token: number | null;
	flops_per_input_token: number | null;
	flops_per_second: number | null;
	baseline_power_w: number | null;
	energy_adjusted_j: number | null;
	energy_per_device_j: number | null;
	energy_breakdown: Record<string, number> | null;
	multi_gpu: boolean | null;
	environment_snapshot: Record<string, unknown> | null;
	measurement_warnings: string[];
	warmup_excluded_samples: number | null;
	reproducibility_notes: string | null;
	timeseries: unknown | null;
	start_time: string;
	end_time: string;
	effective_config: EffectiveConfig;
	process_results: unknown[];
	aggregation: unknown | null;
	thermal_throttle: unknown | null;
	warmup_result: unknown | null;
	latency_stats: unknown | null;
	extended_metrics: unknown | null;
}

export interface HeatmapCell {
	precision: string;
	batch_size: number;
	backend: string;
	attn_implementation: string;
	energy: number;
	throughput: number;
	total_energy_j: number;
	ratioVsBest: number;
	label: string;
}

export interface PowerPoint {
	t: number;
	w: number;
}
