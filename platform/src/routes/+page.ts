import { base } from '$app/paths';
import type { PageLoad } from './$types';
import type { ExperimentResult } from '$lib/data/types.js';
import { toHeatmapData } from '$lib/data/transforms/heatmapData.js';
import { getBackendDefaults, getDimensionValues, sortDimensionValues } from '$lib/data/dimensions.js';
import { smartphoneCharges } from '$lib/data/transforms/equivalences.js';

export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch(`${base}/data/fixture-results.json`);
	const allResults: ExperimentResult[] = await response.json();

	// Discover the first available backend and its default axes
	const backends = sortDimensionValues(getDimensionValues(allResults, 'backend')) as string[];
	const defaultBackend = backends[0] ?? 'pytorch';
	const defaults = getBackendDefaults(allResults, defaultBackend);

	// Default heatmap: first backend, default axes (Beat 2 spec)
	const heatmapCells = toHeatmapData(
		allResults,
		{ backend: defaultBackend },
		defaults.x,
		defaults.y
	);

	// Compute worst/best energy from the filtered heatmap slice
	const worstEnergy = heatmapCells.length > 0 ? heatmapCells[0].energy : 0;
	const bestEnergy = heatmapCells.length > 0 ? heatmapCells[heatmapCells.length - 1].energy : 0;
	const energyRatio = bestEnergy > 0 ? Math.round(worstEnergy / bestEnergy) : 8;

	// Smartphone charge equivalences at deployment scale
	const worstCharges = smartphoneCharges(worstEnergy);
	const bestCharges = smartphoneCharges(bestEnergy);

	// Beat 4: worst and best ExperimentResults for default timeseries comparison
	const worstResult =
		allResults.reduce<ExperimentResult | null>(
			(acc, r) => (!acc || r.avg_energy_per_token_j > acc.avg_energy_per_token_j ? r : acc),
			null
		) ?? allResults[0];
	const bestResult =
		allResults.reduce<ExperimentResult | null>(
			(acc, r) => (!acc || r.avg_energy_per_token_j < acc.avg_energy_per_token_j ? r : acc),
			null
		) ?? allResults[allResults.length - 1];

	// Beat 5: energy by backend — find best (lowest energy) config per backend
	const deploymentData = backends.map((backend) => {
		const candidates = allResults.filter((r) => r.backend === backend);
		const best =
			candidates.reduce<ExperimentResult | null>(
				(acc, r) => (!acc || r.avg_energy_per_token_j < acc.avg_energy_per_token_j ? r : acc),
				null
			) ?? candidates[0];
		const labelMap: Record<string, string> = {
			pytorch: 'PyTorch',
			vllm: 'vLLM',
			tensorrt: 'TensorRT'
		};
		return {
			backend,
			energyPerToken: best?.avg_energy_per_token_j ?? 0,
			label: labelMap[backend] ?? backend
		};
	});

	// Min/max energy range for regulation lever
	const allEnergies = allResults.map((r) => r.avg_energy_per_token_j);
	const minEnergyGlobal = Math.min(...allEnergies);
	const maxEnergyGlobal = Math.max(...allEnergies);
	const globalRatio = maxEnergyGlobal > 0 ? Math.round(maxEnergyGlobal / minEnergyGlobal) : 8;

	return {
		allResults,
		heatmapCells,
		worstEnergy,
		bestEnergy,
		energyRatio,
		worstCharges,
		bestCharges,
		worstResult,
		bestResult,
		deploymentData,
		minEnergyGlobal,
		maxEnergyGlobal,
		globalRatio,
		defaultBackend,
		backends
	};
};
