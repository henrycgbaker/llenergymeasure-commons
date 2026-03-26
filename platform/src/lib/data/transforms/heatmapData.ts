import type { DimensionValue, ExperimentResult, HeatmapCell } from '../types.js';
import { formatDimensionValue, getAllDimensions, getDimension, getDimensionLabel } from '../dimensions.js';

/**
 * Converts raw ExperimentResult records into typed HeatmapCell data,
 * filtered by an arbitrary set of dimension constraints and projected
 * onto caller-chosen x/y axes.
 *
 * Returns cells sorted by energy descending (worst to best)
 * for progressive reveal in the scroll narrative.
 */
export function toHeatmapData(
	results: ExperimentResult[],
	filters: Record<string, DimensionValue>,
	xAxisKey: string,
	yAxisKey: string
): HeatmapCell[] {
	const filtered = results.filter((r) => {
		const dims = getAllDimensions(r);
		for (const [key, value] of Object.entries(filters)) {
			if (dims[key] !== value) return false;
		}
		return true;
	});

	if (filtered.length === 0) return [];

	const minEnergy = Math.min(...filtered.map((r) => r.avg_energy_per_token_j));

	const cells: HeatmapCell[] = filtered.map((r) => {
		const dims = getAllDimensions(r);
		const xVal = getDimension(r, xAxisKey);
		const yVal = getDimension(r, yAxisKey);
		return {
			xValue: String(xVal ?? ''),
			yValue: String(yVal ?? ''),
			dimensions: dims,
			energy: r.avg_energy_per_token_j,
			throughput: r.avg_tokens_per_second,
			total_energy_j: r.total_energy_j,
			ratioVsBest: r.avg_energy_per_token_j / minEnergy,
			label: `${getDimensionLabel(xAxisKey)} ${formatDimensionValue(xAxisKey, xVal ?? '')}, ${getDimensionLabel(yAxisKey)} ${formatDimensionValue(yAxisKey, yVal ?? '')}`
		};
	});

	// Sort by energy descending so worst cell appears first
	cells.sort((a, b) => b.energy - a.energy);

	return cells;
}
