import { base } from '$app/paths';
import type { PageLoad } from './$types';
import type { ExperimentResult, PCAProjection } from '$lib/data/types.js';

export const load: PageLoad = async ({ fetch }) => {
	const [resultsResponse, pcaResponse] = await Promise.all([
		fetch(`${base}/data/fixture-results.json`),
		fetch(`${base}/data/pca-projection.json`)
	]);

	const allResults: ExperimentResult[] = await resultsResponse.json();
	const pcaProjection: PCAProjection = await pcaResponse.json();

	return { allResults, pcaProjection };
};
