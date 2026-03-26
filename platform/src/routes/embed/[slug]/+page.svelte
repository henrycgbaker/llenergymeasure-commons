<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import ConfigHeatmapInteractive from '$lib/components/charts/ConfigHeatmapInteractive.svelte';
	import PowerTimeseries from '$lib/components/charts/PowerTimeseries.svelte';
	import Surface3D from '$lib/components/charts/Surface3D.svelte';
	import PCAProjection from '$lib/components/charts/PCAProjection.svelte';
	import ParallelCoordinates from '$lib/components/charts/ParallelCoordinates.svelte';
	import { applyExplorerFilters } from '$lib/data/transforms/explorerFilters.js';
	import { toParallelData } from '$lib/data/transforms/parallelCoordsData.js';
	import type { ChartSlug } from '$lib/data/chartMeta.js';
	import type { ExplorerFilterState } from '$lib/data/types.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const slug = $derived(data.slug as ChartSlug);

	let filterState = $state<ExplorerFilterState>({
		dimensionFilters: {},
		energyRange: null
	});

	let timeseriesProgress = $state(0);

	const filteredResults = $derived(applyExplorerFilters(data.allResults, filterState));
	const parallelData = $derived(toParallelData(filteredResults));
	const filteredIds = $derived(filteredResults.map((r) => r.experiment_id));

	const selectedBackend = $derived(
		filterState.dimensionFilters.backend as string | null ?? null
	);

	function handleParallelBrush(ranges: {
		energyRange?: [number, number] | null;
	}) {
		filterState = { ...filterState, energyRange: ranges.energyRange ?? null };
	}

	let resizeObserver: ResizeObserver | null = null;

	function sendHeight() {
		window.parent.postMessage({ type: 'llem-resize', height: document.body.scrollHeight }, '*');
	}

	onMount(() => {
		// Restore dimension filters from URL query parameters
		const params = new URLSearchParams(window.location.search);
		const restored: Record<string, string> = {};
		for (const [key, value] of params.entries()) {
			restored[key] = value;
		}
		if (Object.keys(restored).length > 0) {
			filterState = { ...filterState, dimensionFilters: restored };
		}

		sendHeight();

		resizeObserver = new ResizeObserver(() => {
			sendHeight();
		});
		resizeObserver.observe(document.body);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
	});
</script>

<div class="embed-page">
	<div class="chart-container">
		{#if slug === 'heatmap'}
			<ConfigHeatmapInteractive allResults={filteredResults} />
		{:else if slug === 'timeseries'}
			<PowerTimeseries allResults={data.allResults} scrollProgress={timeseriesProgress} />
		{:else if slug === 'surface'}
			<Surface3D results={filteredResults} />
		{:else if slug === 'pca'}
			<PCAProjection pcaProjection={data.pcaProjection} {selectedBackend} filteredExperimentIds={filteredIds} />
		{:else if slug === 'parallel-coords'}
			<ParallelCoordinates data={parallelData} onBrush={handleParallelBrush} />
		{/if}
	</div>

	<footer class="embed-attribution">
		<a href="{base}/chart/{slug}/" class="embed-attribution__link" target="_blank" rel="noopener">
			Henry Baker . Hertie School
		</a>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
	}

	.embed-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--color-surface);
	}

	.chart-container {
		flex: 1;
		padding: var(--space-4);
	}

	.embed-attribution {
		padding: var(--space-2) var(--space-4);
		border-top: 1px solid var(--color-border);
		text-align: right;
	}

	.embed-attribution__link {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.embed-attribution__link:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}
</style>
