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
		backend: null,
		attn: null,
		precision: null,
		batchSize: null,
		energyRange: null,
		batchRange: null
	});

	let timeseriesProgress = $state(0);

	const filteredResults = $derived(applyExplorerFilters(data.allResults, filterState));
	const parallelData = $derived(toParallelData(filteredResults));
	const filteredIds = $derived(filteredResults.map((r) => r.experiment_id));

	function handleParallelBrush(ranges: {
		energyRange?: [number, number] | null;
		batchRange?: [number, number] | null;
	}) {
		filterState = { ...filterState, ...ranges };
	}

	let resizeObserver: ResizeObserver | null = null;

	function sendHeight() {
		window.parent.postMessage({ type: 'llem-resize', height: document.body.scrollHeight }, '*');
	}

	onMount(() => {
		// Restore filter state from URL query parameters (per Research pitfall 2)
		const params = new URLSearchParams(window.location.search);
		const backend = params.get('backend');
		const attn = params.get('attn');
		const precision = params.get('precision');
		const batchSizeStr = params.get('batchSize');
		const batchSize = batchSizeStr !== null ? Number(batchSizeStr) : null;

		if (backend || attn || precision || batchSize !== null) {
			filterState = {
				...filterState,
				backend: backend ?? null,
				attn: attn ?? null,
				precision: precision ?? null,
				batchSize: !isNaN(batchSize as number) ? batchSize : null
			};
		}

		// Send initial height immediately
		sendHeight();

		// ResizeObserver: send height to parent on resize
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
			<PCAProjection pcaProjection={data.pcaProjection} filteredExperimentIds={filteredIds} />
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
