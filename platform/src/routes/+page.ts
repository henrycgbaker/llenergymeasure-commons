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

	// Beat 5: energy by backend (fixed sdpa attention, bf16 precision)
	// Shows deployment lever: switching backend at fixed precision config
	const deploymentData = (['pytorch', 'vllm', 'tensorrt'] as const).map((backend) => {
		// Find the best (lowest energy) bf16 result per backend, any batch size
		const candidates = allResults.filter(
			(r) =>
				r.backend === backend &&
				r.effective_config.precision === 'bf16' &&
				r.effective_config.attn_implementation === 'sdpa'
		);
		const best =
			candidates.reduce<ExperimentResult | null>(
				(acc, r) => (!acc || r.avg_energy_per_token_j < acc.avg_energy_per_token_j ? r : acc),
				null
			) ?? candidates[0];
		return {
			backend,
			energyPerToken: best?.avg_energy_per_token_j ?? 0,
			label: backend === 'pytorch' ? 'PyTorch' : backend === 'vllm' ? 'vLLM' : 'TensorRT'
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
		globalRatio
	};
};
