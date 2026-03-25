import type { ExperimentResult, SurfaceGrid } from '../types.js';

const AXIS_LABELS: Record<string, string> = {
	precision: 'Precision',
	batch_size: 'Batch Size',
	backend: 'Backend',
	attn_implementation: 'Attention'
};

function getAxisValue(result: ExperimentResult, axis: string): string {
	switch (axis) {
		case 'precision':
			return result.effective_config.precision;
		case 'batch_size':
			return String(result.effective_config.batch_size);
		case 'backend':
			return result.backend;
		case 'attn_implementation':
			return result.effective_config.attn_implementation;
		default:
			return String((result as unknown as Record<string, unknown>)[axis] ?? '');
	}
}

function sortAxisValues(values: string[], axis: string): string[] {
	if (axis === 'batch_size') {
		return [...values].sort((a, b) => Number(a) - Number(b));
	}
	return [...values].sort();
}

export function toSurfaceGrid(
	results: ExperimentResult[],
	xAxis: string,
	yAxis: string
): SurfaceGrid {
	const xValuesSet = new Set<string>();
	const yValuesSet = new Set<string>();

	for (const r of results) {
		xValuesSet.add(getAxisValue(r, xAxis));
		yValuesSet.add(getAxisValue(r, yAxis));
	}

	const x = sortAxisValues([...xValuesSet], xAxis);
	const y = sortAxisValues([...yValuesSet], yAxis);

	const xIndex = new Map(x.map((v, i) => [v, i]));
	const yIndex = new Map(y.map((v, i) => [v, i]));

	// Accumulate sums and counts for averaging
	const sums: number[][] = Array.from({ length: y.length }, () => new Array(x.length).fill(0));
	const counts: number[][] = Array.from({ length: y.length }, () =>
		new Array(x.length).fill(0)
	);

	for (const r of results) {
		const xi = xIndex.get(getAxisValue(r, xAxis));
		const yi = yIndex.get(getAxisValue(r, yAxis));
		if (xi === undefined || yi === undefined) continue;
		sums[yi][xi] += r.avg_energy_per_token_j;
		counts[yi][xi] += 1;
	}

	// Compute cell averages; collect non-missing values for global mean
	const z: number[][] = Array.from({ length: y.length }, () => new Array(x.length).fill(0));
	const nonMissingValues: number[] = [];

	for (let yi = 0; yi < y.length; yi++) {
		for (let xi = 0; xi < x.length; xi++) {
			if (counts[yi][xi] > 0) {
				const avg = sums[yi][xi] / counts[yi][xi];
				z[yi][xi] = avg;
				nonMissingValues.push(avg);
			}
		}
	}

	// Fill missing cells with global mean
	const globalMean =
		nonMissingValues.length > 0
			? nonMissingValues.reduce((a, b) => a + b, 0) / nonMissingValues.length
			: 0;

	for (let yi = 0; yi < y.length; yi++) {
		for (let xi = 0; xi < x.length; xi++) {
			if (counts[yi][xi] === 0) {
				z[yi][xi] = globalMean;
			}
		}
	}

	return {
		x,
		y,
		z,
		xLabel: AXIS_LABELS[xAxis] ?? xAxis,
		yLabel: AXIS_LABELS[yAxis] ?? yAxis
	};
}
