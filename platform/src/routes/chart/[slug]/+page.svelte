<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { base } from '$app/paths';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import ConfigHeatmapInteractive from '$lib/components/charts/ConfigHeatmapInteractive.svelte';
	import PowerTimeseries from '$lib/components/charts/PowerTimeseries.svelte';
	import Surface3D from '$lib/components/charts/Surface3D.svelte';
	import PCAProjection from '$lib/components/charts/PCAProjection.svelte';
	import ParallelCoordinates from '$lib/components/charts/ParallelCoordinates.svelte';
	import MethodologyLink from '$lib/components/charts/MethodologyLink.svelte';
	import DownloadButton from '$lib/components/charts/DownloadButton.svelte';
	import CitationBlock from '$lib/components/CitationBlock.svelte';
	import EmbedCodeBlock from '$lib/components/EmbedCodeBlock.svelte';
	import ChartExportButton from '$lib/components/ChartExportButton.svelte';
	import { CHART_META } from '$lib/data/chartMeta.js';
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
	const meta = $derived(CHART_META[slug]);

	const siteUrl: string =
		(import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://llem-commons.hertie-school.org';
	const ogImage = $derived(`${siteUrl}/og/${slug}-preview.png`);

	// ── Filter state (restored from URL on mount) ──────────────────────────
	let filterState = $state<ExplorerFilterState>({
		backend: null,
		attn: null,
		precision: null,
		batchSize: null,
		energyRange: null,
		batchRange: null
	});

	let timeseriesProgress = $state(0);

	// ── Derived filtered data ─────────────────────────────────────────────
	const filteredResults = $derived(applyExplorerFilters(data.allResults, filterState));
	const parallelData = $derived(toParallelData(filteredResults));
	const filteredIds = $derived(filteredResults.map((r) => r.experiment_id));

	// ── Export container refs ─────────────────────────────────────────────
	let exportContainer = $state<HTMLDivElement | undefined>(undefined);

	// ── Filter handlers ───────────────────────────────────────────────────
	function handleParallelBrush(ranges: {
		energyRange?: [number, number] | null;
		batchRange?: [number, number] | null;
	}) {
		filterState = { ...filterState, ...ranges };
		syncFilterToUrl();
	}

	function syncFilterToUrl() {
		const params = new URLSearchParams();
		if (filterState.backend) params.set('backend', filterState.backend);
		if (filterState.attn) params.set('attn', filterState.attn);
		if (filterState.precision) params.set('precision', filterState.precision);
		if (filterState.batchSize !== null) params.set('batchSize', String(filterState.batchSize));
		const qs = params.toString();
		history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
	}

	onMount(() => {
		// Restore filter state from URL query parameters
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
	});
</script>

<svelte:head>
	<title>{meta.title} — llem-commons</title>
	<meta name="description" content={meta.description} />
	<!-- Open Graph -->
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={meta.altText} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="{siteUrl}/chart/{slug}/" />
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={meta.altText} />
</svelte:head>

<PageLayout wide>
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="{base}/">Narrative</a>
		<span aria-hidden="true"> / </span>
		<span aria-current="page">{meta.title}</span>
	</nav>

	<!-- Export wrapper: title + chart + attribution, captured as a unit by html-to-image -->
	<div bind:this={exportContainer} class="export-wrapper">
		<div class="export-title" aria-hidden="true">
			<h1 class="chart-heading">{meta.title}</h1>
		</div>

		<div class="chart-area">
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

		<p class="export-attribution" aria-label="Attribution">Henry Baker . Hertie School</p>
	</div>

	<div class="chart-controls">
		<ChartExportButton
			chartType="svg"
			exportContainerRef={exportContainer}
			{slug}
			chartTitle={meta.title}
		/>
	</div>

	<p class="chart-description">{meta.description}</p>

	<div class="chart-actions">
		<MethodologyLink />
		<DownloadButton results={filteredResults} totalCount={data.allResults.length} />
	</div>

	<CitationBlock chartTitle={meta.title} {slug} />
	<EmbedCodeBlock {slug} />

	<nav class="page-nav" aria-label="Page navigation">
		<a href="{base}/" class="page-nav__link">← Back to narrative</a>
		<a href="{base}/explorer" class="page-nav__link">Explore all charts →</a>
	</nav>
</PageLayout>

<style>
	.breadcrumb {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.export-wrapper {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.export-title {
		padding: var(--space-4) var(--space-6) var(--space-2);
		text-align: center;
	}

	.chart-heading {
		font-family: var(--font-heading);
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0;
		line-height: var(--leading-tight);
	}

	.chart-area {
		padding: var(--space-4) var(--space-6);
	}

	.export-attribution {
		text-align: center;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		padding: var(--space-2) var(--space-6) var(--space-4);
		margin: 0;
		border-top: 1px solid var(--color-border);
	}

	.chart-controls {
		margin-top: var(--space-4);
	}

	.chart-description {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: var(--space-6) 0;
		max-width: 65ch;
	}

	.chart-actions {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		flex-wrap: wrap;
		padding: var(--space-4) 0;
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-4);
	}

	.page-nav {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.page-nav__link {
		font-size: var(--text-sm);
		color: var(--color-primary);
		text-decoration: none;
		font-weight: var(--weight-medium);
	}

	.page-nav__link:hover {
		text-decoration: underline;
	}
</style>
