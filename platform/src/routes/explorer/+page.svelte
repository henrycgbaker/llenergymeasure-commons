<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import DataBanner from '$lib/components/DataBanner.svelte';
	import ExplorerTabs from '$lib/components/charts/ExplorerTabs.svelte';
	import ExplorerFilters from '$lib/components/charts/ExplorerFilters.svelte';
	import ConfigHeatmapInteractive from '$lib/components/charts/ConfigHeatmapInteractive.svelte';
	import Surface3D from '$lib/components/charts/Surface3D.svelte';
	import PCAProjection from '$lib/components/charts/PCAProjection.svelte';
	import ParallelCoordinates from '$lib/components/charts/ParallelCoordinates.svelte';
	import DownloadButton from '$lib/components/charts/DownloadButton.svelte';
	import MethodologyLink from '$lib/components/charts/MethodologyLink.svelte';
	import { applyExplorerFilters } from '$lib/data/transforms/explorerFilters.js';
	import { toParallelData } from '$lib/data/transforms/parallelCoordsData.js';
	import { toCSV, toJSON, triggerDownload } from '$lib/data/transforms/downloadUtils.js';
	import type { ExplorerFilterState } from '$lib/data/types.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	// ── Filter state ────────────────────────────────────────────────────────
	let filterState = $state<ExplorerFilterState>({
		backend: null,
		attn: null,
		precision: null,
		batchSize: null,
		energyRange: null,
		batchRange: null
	});

	// ── Tab state ───────────────────────────────────────────────────────────
	let activeTab = $state('surface');

	// ── Derived filtered data ───────────────────────────────────────────────
	const filteredResults = $derived(applyExplorerFilters(data.allResults, filterState));

	// ── Handlers ────────────────────────────────────────────────────────────
	function handleFilterChange(partial: Partial<ExplorerFilterState>) {
		filterState = { ...filterState, ...partial };
	}

	function handleParallelBrush(ranges: {
		energyRange?: [number, number] | null;
		batchRange?: [number, number] | null;
	}) {
		filterState = { ...filterState, ...ranges };
	}

	function handleTabChange(tab: string) {
		activeTab = tab;
	}

	function downloadFullCSV() {
		triggerDownload(toCSV(data.allResults), 'llem-full-dataset.csv', 'text/csv;charset=utf-8;');
	}

	function downloadFullJSON() {
		triggerDownload(toJSON(data.allResults), 'llem-full-dataset.json', 'application/json');
	}
</script>

<DataBanner />

<PageLayout wide>
	<h1 class="page-title">Configuration Explorer</h1>
	<p class="page-intro">
		Explore the full configuration landscape across all backends, attention implementations,
		precision settings, and batch sizes. Use the filters to narrow down the dataset, then switch
		between visualisation modes to uncover patterns in energy efficiency.
	</p>

	<ExplorerFilters {filterState} onFilterChange={handleFilterChange} />

	<div class="toolbar">
		<DownloadButton results={filteredResults} totalCount={data.allResults.length} />
		<span class="filter-count">
			{filteredResults.length} of {data.allResults.length} configurations
		</span>
	</div>

	<ExplorerTabs {activeTab} onTabChange={handleTabChange} />

	<div
		class="chart-area"
		role="tabpanel"
		id="tabpanel-{activeTab}"
		aria-labelledby="tab-{activeTab}"
		tabindex="0"
	>
		{#if activeTab === 'surface'}
			<Surface3D results={filteredResults} />
		{:else if activeTab === 'pca'}
			<PCAProjection
				pcaProjection={data.pcaProjection}
				filteredExperimentIds={filteredResults.map((r) => r.experiment_id)}
			/>
		{:else if activeTab === 'parallel'}
			<ParallelCoordinates data={toParallelData(filteredResults)} onBrush={handleParallelBrush} />
		{:else if activeTab === 'heatmap'}
			<ConfigHeatmapInteractive allResults={filteredResults} />
		{/if}
	</div>

	<footer class="explorer-footer">
		<div class="full-download">
			<h2 class="full-download__heading">Download complete dataset</h2>
			<p class="full-download__desc">
				Download all {data.allResults.length} configurations including energy, throughput, and hardware
				configuration details.
			</p>
			<div class="full-download__actions">
				<button class="full-dl-btn" onclick={downloadFullCSV} type="button"> Download CSV </button>
				<button class="full-dl-btn" onclick={downloadFullJSON} type="button">
					Download JSON
				</button>
			</div>
		</div>
		<MethodologyLink />
	</footer>
</PageLayout>

<style>
	.page-title {
		font-family: var(--font-heading);
		font-size: var(--text-4xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0 0 var(--space-4);
		line-height: var(--leading-tight);
	}

	.page-intro {
		font-size: var(--text-base);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		max-width: 65ch;
		margin: 0 0 var(--space-6);
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-4);
		padding: var(--space-2) 0;
		margin-bottom: var(--space-2);
	}

	.filter-count {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.chart-area {
		min-height: 500px;
		width: 100%;
		padding: var(--space-6) 0;
	}

	.explorer-footer {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.full-download {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.full-download__heading {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0;
	}

	.full-download__desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0;
		max-width: 55ch;
	}

	.full-download__actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.full-dl-btn {
		padding: var(--space-2) var(--space-5);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.full-dl-btn:hover {
		background: var(--color-primary);
		color: var(--color-surface);
	}

	.full-dl-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.chart-area:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	@media (max-width: 600px) {
		.chart-area {
			min-height: 350px;
		}

		.page-title {
			font-size: var(--text-2xl);
		}
	}
</style>
