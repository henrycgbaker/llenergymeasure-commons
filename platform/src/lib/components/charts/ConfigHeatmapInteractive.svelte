<script lang="ts">
	import ConfigHeatmap from './ConfigHeatmap.svelte';
	import HeatmapFilters from './HeatmapFilters.svelte';
	import HeatmapTooltip from './HeatmapTooltip.svelte';
	import HeatmapDetailPanel from './HeatmapDetailPanel.svelte';
	import ExpandableDetail from '$lib/components/ExpandableDetail.svelte';
	import MethodologyLink from './MethodologyLink.svelte';
	import { toHeatmapData } from '$lib/data/transforms/heatmapData.js';
	import { getBackendDefaults, getDimensionLabel, getDimensionValues, sortDimensionValues } from '$lib/data/dimensions.js';
	import type { DimensionValue, ExperimentResult, HeatmapCell } from '$lib/data/types.js';

	interface Props {
		allResults: ExperimentResult[];
	}

	const { allResults }: Props = $props();

	// ── Filter state ────────────────────────────────────────────────────────
	const availableBackends = $derived(
		sortDimensionValues(getDimensionValues(allResults, 'backend')) as string[]
	);
	let selectedBackend = $state(availableBackends[0] ?? 'pytorch');
	let selectedMetric = $state<'energy' | 'throughput'>('energy');

	// Backend-specific dimension filters (e.g. { attn_implementation: 'sdpa' })
	let dimensionFilters = $state<Record<string, DimensionValue>>({});

	// Default heatmap axes for the selected backend
	const axisDefaults = $derived(getBackendDefaults(allResults, selectedBackend));

	// ── Interaction state ───────────────────────────────────────────────────
	let hoveredCell = $state<HeatmapCell | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let selectedCell = $state<HeatmapCell | null>(null);
	let keyboardFocusedCell = $state<HeatmapCell | null>(null);

	// ── Screen reader live region ────────────────────────────────────────────
	const liveAnnouncement = $derived.by(() => {
		const cell = keyboardFocusedCell;
		if (!cell) return '';
		const ratio = cell.ratioVsBest.toFixed(2);
		return `${cell.label}: ${cell.energy.toFixed(4)} joules per token, ${ratio}x versus optimal`;
	});

	// Zoom reset: increment to signal ConfigHeatmap to reset zoom
	let zoomResetTrigger = $state(0);

	// ── Derived data ────────────────────────────────────────────────────────
	const heatmapFilters = $derived({
		backend: selectedBackend,
		...dimensionFilters
	});
	const cells = $derived(
		toHeatmapData(allResults, heatmapFilters, axisDefaults.x, axisDefaults.y)
	);

	// ── Container ref for tooltip width awareness ───────────────────────────
	let containerEl: HTMLDivElement;
	let containerWidth = $state(500);

	$effect(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver(([entry]) => {
			containerWidth = entry.contentRect.width;
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	// ── Event handlers ──────────────────────────────────────────────────────
	function handleBackendChange(value: string) {
		selectedBackend = value;
		dimensionFilters = {};
		selectedCell = null;
		zoomResetTrigger++;
	}

	function handleDimensionFilterChange(key: string, value: DimensionValue) {
		dimensionFilters = { ...dimensionFilters, [key]: value };
		selectedCell = null;
		zoomResetTrigger++;
	}

	function handleMetricChange(value: string) {
		selectedMetric = value as 'energy' | 'throughput';
		selectedCell = null;
		zoomResetTrigger++;
	}

	function handleCellHover(cell: HeatmapCell | null, x: number, y: number) {
		hoveredCell = cell;
		tooltipX = x;
		tooltipY = y;
	}

	function handleCellFocus(cell: HeatmapCell | null) {
		keyboardFocusedCell = cell;
		if (cell) {
			hoveredCell = cell;
			tooltipX = 12;
			tooltipY = 12;
		} else {
			hoveredCell = null;
		}
	}

	function handleCellClick(cell: HeatmapCell) {
		selectedCell =
			selectedCell?.xValue === cell.xValue && selectedCell?.yValue === cell.yValue
				? null
				: cell;
	}
</script>

<div class="interactive-heatmap" bind:this={containerEl}>
	<!-- Screen reader live region: announces keyboard-focused cell details -->
	<div class="sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>

	<!-- Filter controls -->
	<HeatmapFilters
		{allResults}
		{selectedBackend}
		{dimensionFilters}
		{selectedMetric}
		onBackendChange={handleBackendChange}
		onDimensionFilterChange={handleDimensionFilterChange}
		onMetricChange={handleMetricChange}
	/>

	<!-- Chart container (position: relative for tooltip) -->
	<div class="chart-wrapper">
		{#if cells.length > 0}
			<ConfigHeatmap
				{cells}
				xAxisLabel={getDimensionLabel(axisDefaults.x)}
				yAxisLabel={getDimensionLabel(axisDefaults.y)}
				revealProgress={1}
				interactive={true}
				{selectedCell}
				metric={selectedMetric}
				onCellHover={handleCellHover}
				onCellClick={handleCellClick}
				onCellFocus={handleCellFocus}
				{zoomResetTrigger}
				width={Math.min(containerWidth, 700)}
				height={420}
			/>
		{:else}
			<div class="empty-state">
				<p>No data for this combination. Try a different filter.</p>
			</div>
		{/if}

		<!-- Tooltip positioned absolutely within chart wrapper -->
		<HeatmapTooltip
			cell={hoveredCell}
			x={tooltipX}
			y={tooltipY}
			visible={hoveredCell !== null}
			{containerWidth}
		/>
	</div>

	<!-- Detail panel below chart -->
	<HeatmapDetailPanel cell={selectedCell} />

	<!-- Methodology link -->
	<MethodologyLink />

	<!-- Technical note (NARR-06 depth layer) -->
	<ExpandableDetail title="Understanding this chart">
		<p class="chart-note">
			Each cell represents one hardware/software configuration. The x-axis shows
			{getDimensionLabel(axisDefaults.x).toLowerCase()} and the y-axis shows
			{getDimensionLabel(axisDefaults.y).toLowerCase()}. Colour encodes energy per output
			token (red = high energy, blue = efficient) when viewing the energy metric, or throughput in
			tokens/second when viewing the throughput metric.
		</p>
		<p class="chart-note">
			Filters select specific dimension values. The ratio vs best is always computed within the
			selected slice — so "3x" means three times worse than the most efficient configuration in
			that slice, not globally.
		</p>
		<p class="chart-note">
			Scroll-wheel or pinch to zoom. Click any cell to see full details below the chart. Click again
			to deselect.
		</p>
	</ExpandableDetail>
</div>

<style>
	/* Visually hidden but accessible to screen readers */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.interactive-heatmap {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
	}

	.chart-wrapper {
		position: relative;
		width: 100%;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.chart-note {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0;
	}
</style>
