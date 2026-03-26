import { base } from '$app/paths';
import type { EntryGenerator, PageLoad } from './$types';
import type { ExperimentResult, PCAProjection } from '$lib/data/types.js';
import { CHART_SLUGS } from '$lib/data/chartMeta.js';

export const entries: EntryGenerator = () => CHART_SLUGS.map((slug) => ({ slug }));

export const load: PageLoad = async ({ fetch, params }) => {
	const [resultsResponse, pcaResponse] = await Promise.all([
		fetch(`${base}/data/fixture-results.json`),
		fetch(`${base}/data/pca-projection.json`)
	]);

	const allResults: ExperimentResult[] = await resultsResponse.json();
	const pcaProjection: PCAProjection = await pcaResponse.json();

	return { slug: params.slug, allResults, pcaProjection };
};
