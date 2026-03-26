import type { DimensionValue, ExperimentResult } from './types.js';

const DIMENSION_LABELS: Record<string, string> = {
	backend: 'Backend',
	precision: 'Precision',
	batch_size: 'Batch Size',
	attn_implementation: 'Attention',
	enforce_eager: 'Enforce Eager',
	enable_chunked_prefill: 'Chunked Prefill',
	max_num_seqs: 'Max Sequences'
};

const DEFAULT_AXES: Record<string, { x: string; y: string }> = {
	pytorch: { x: 'precision', y: 'batch_size' },
	vllm: { x: 'enforce_eager', y: 'max_num_seqs' },
	tensorrt: { x: 'precision', y: 'batch_size' }
};

/**
 * Read a single dimension value from a result, checking common fields
 * then the backend-specific dimensions map.
 */
export function getDimension(
	result: ExperimentResult,
	key: string
): DimensionValue | undefined {
	if (key === 'backend') return result.backend;
	if (key === 'precision') return result.effective_config.precision;
	return result.effective_config.dimensions[key];
}

/**
 * Merge common dimensions (backend, precision) with backend-specific
 * dimensions into a single flat map.
 */
export function getAllDimensions(result: ExperimentResult): Record<string, DimensionValue> {
	return {
		backend: result.backend,
		precision: result.effective_config.precision,
		...result.effective_config.dimensions
	};
}

/**
 * Human-readable label for a dimension key.
 * Falls back to title-casing the snake_case key.
 */
export function getDimensionLabel(key: string): string {
	if (DIMENSION_LABELS[key]) return DIMENSION_LABELS[key];
	return key
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

/**
 * Format a dimension value for display.
 */
export function formatDimensionValue(key: string, value: DimensionValue): string {
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return String(value);
}

/**
 * Discover which dimension keys exist across a set of results,
 * optionally filtered to a specific backend.
 */
export function getAvailableDimensions(
	results: ExperimentResult[],
	backend?: string
): string[] {
	const keys = new Set<string>();
	for (const r of results) {
		if (backend !== undefined && r.backend !== backend) continue;
		keys.add('backend');
		keys.add('precision');
		for (const k of Object.keys(r.effective_config.dimensions)) {
			keys.add(k);
		}
	}
	return [...keys];
}

/**
 * Get unique values for a dimension across a set of results.
 */
export function getDimensionValues(
	results: ExperimentResult[],
	key: string
): DimensionValue[] {
	const seen = new Set<string>();
	const values: DimensionValue[] = [];
	for (const r of results) {
		const v = getDimension(r, key);
		if (v === undefined) continue;
		const s = String(v);
		if (!seen.has(s)) {
			seen.add(s);
			values.push(v);
		}
	}
	return values;
}

/**
 * Returns default heatmap axis pair for a backend.
 * Falls back to first two available backend-specific dimensions.
 */
export function getBackendDefaults(
	results: ExperimentResult[],
	backend: string
): { x: string; y: string } {
	if (DEFAULT_AXES[backend]) return DEFAULT_AXES[backend];

	const dims = getAvailableDimensions(results, backend).filter(
		(k) => k !== 'backend' && k !== 'precision'
	);
	return {
		x: dims[0] ?? 'precision',
		y: dims[1] ?? 'backend'
	};
}

/**
 * Infer the type of a dimension from its values.
 */
export function inferDimensionType(
	values: DimensionValue[]
): 'number' | 'boolean' | 'string' {
	if (values.length === 0) return 'string';
	if (values.every((v) => typeof v === 'boolean')) return 'boolean';
	if (values.every((v) => typeof v === 'number')) return 'number';
	return 'string';
}

/**
 * Sort dimension values in a sensible order:
 * numbers ascending, booleans false-first, strings alphabetical.
 */
export function sortDimensionValues(values: DimensionValue[]): DimensionValue[] {
	const type = inferDimensionType(values);
	if (type === 'number') return [...values].sort((a, b) => (a as number) - (b as number));
	if (type === 'boolean') return [...values].sort((a, b) => (a ? 1 : 0) - (b ? 1 : 0));
	return [...values].sort((a, b) => String(a).localeCompare(String(b)));
}
