import type { PageLoad } from './$types';
import type { ExperimentResult } from '$lib/data/types.js';
import { toHeatmapData } from '$lib/data/transforms/heatmapData.js';
import { smartphoneCharges } from '$lib/data/transforms/equivalences.js';

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch('/data/fixture-results.json');
	const allResults: ExperimentResult[] = await response.json();

	// Default heatmap filter: pytorch + sdpa (Beat 2 spec)
	const heatmapCells = toHeatmapData(allResults, 'pytorch', 'sdpa');

	// Compute worst/best energy from the filtered heatmap slice
	const worstEnergy = heatmapCells.length > 0 ? heatmapCells[0].energy : 0;
	const bestEnergy = heatmapCells.length > 0 ? heatmapCells[heatmapCells.length - 1].energy : 0;
	const energyRatio = bestEnergy > 0 ? Math.round(worstEnergy / bestEnergy) : 8;

	// Smartphone charge equivalences at deployment scale (10M queries/month, 128 tokens/query)
	const worstCharges = smartphoneCharges(worstEnergy);
	const bestCharges = smartphoneCharges(bestEnergy);

	return {
		allResults,
		heatmapCells,
		worstEnergy,
		bestEnergy,
		energyRatio,
		worstCharges,
		bestCharges
	};
};
