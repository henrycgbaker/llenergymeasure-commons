import type { ExperimentResult, SurfaceGrid } from '../types.js';
import { getDimension, getDimensionLabel } from '../dimensions.js';

function getAxisValue(result: ExperimentResult, axis: string): string {
	const val = getDimension(result, axis);
	return val === undefined ? '' : String(val);
}

function sortAxisValues(values: string[]): string[] {
	const allNumeric = values.every((v) => !isNaN(Number(v)));
	if (allNumeric) return [...values].sort((a, b) => Number(a) - Number(b));
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

	const x = sortAxisValues([...xValuesSet]);
	const y = sortAxisValues([...yValuesSet]);

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
		xLabel: getDimensionLabel(xAxis),
		yLabel: getDimensionLabel(yAxis)
	};
}
