export type DimensionValue = string | number | boolean;

export interface EffectiveConfig {
	model: string;
	backend: string;
	precision: string;
	n: number;
	max_input_tokens: number;
	max_output_tokens: number;
	dimensions: Record<string, DimensionValue>;
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
	energy_per_device_j: number[] | null;
	energy_breakdown: Record<string, unknown> | null;
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
	xValue: string;
	yValue: string;
	dimensions: Record<string, DimensionValue>;
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

export interface SurfaceGrid {
	x: string[];
	y: string[];
	z: number[][];
	xLabel: string;
	yLabel: string;
}

export interface ParallelRecord {
	experiment_id: string;
	dimensions: Record<string, DimensionValue>;
	avg_energy_per_token_j: number;
}

export interface ExplorerFilterState {
	dimensionFilters: Record<string, DimensionValue | null>;
	energyRange: [number, number] | null;
}

export interface PCAPoint {
	experiment_id: string;
	pc1: number;
	pc2: number;
	pc3: number;
	energy: number;
	throughput: number;
	backend: string;
	dimensions: Record<string, DimensionValue>;
}

export interface PCAProjection {
	backends: Record<
		string,
		{
			explained_variance: number[];
			points: PCAPoint[];
		}
	>;
}
