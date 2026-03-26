<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import ConfigHeatmapInteractive from './ConfigHeatmapInteractive.svelte';
	import { toSurfaceGrid } from '$lib/data/transforms/surfaceData.js';
	import type { ExperimentResult } from '$lib/data/types.js';

	interface Props {
		results: ExperimentResult[];
		xAxis?: string;
		yAxis?: string;
	}

	let {
		results,
		xAxis = $bindable('precision'),
		yAxis = $bindable('batch_size')
	}: Props = $props();

	const AXIS_OPTIONS = [
		{ value: 'precision', label: 'Precision' },
		{ value: 'batch_size', label: 'Batch Size' },
		{ value: 'backend', label: 'Backend' },
		{ value: 'attn_implementation', label: 'Attention' }
	];

	// RdBu colour scale matching design tokens
	const COLORSCALE: [number, string][] = [
		[0, '#2166ac'],
		[0.5, '#f7f7f7'],
		[1, '#d6604d']
	];

	let plotDiv = $state<HTMLDivElement | undefined>(undefined);
	let webglUnavailable = $state(false);
	// Plotly has no @types package; using unknown with runtime casts
	let PlotlyModule = $state<unknown>(null);

	function isWebGLAvailable(): boolean {
		try {
			const canvas = document.createElement('canvas');
			return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
		} catch {
			return false;
		}
	}

	function getPlotly() {
		return PlotlyModule as {
			newPlot: (_el: HTMLElement, _data: unknown[], _layout: unknown, _config: unknown) => void;
			react: (_el: HTMLElement, _data: unknown[], _layout: unknown, _config: unknown) => void;
			purge: (_el: HTMLElement) => void;
		} | null;
	}

	function renderChart() {
		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;

		const grid = toSurfaceGrid(results, xAxis, yAxis);

		const trace = {
			type: 'surface',
			x: grid.x,
			y: grid.y,
			z: grid.z,
			colorscale: COLORSCALE,
			hovertemplate: '%{x} x %{y}<br>Energy: %{z:.4f} J/tok<extra></extra>'
		};

		const layout = {
			scene: {
				camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
				xaxis: { title: grid.xLabel },
				yaxis: { title: grid.yLabel },
				zaxis: { title: 'Energy (J/token)' }
			},
			margin: { l: 0, r: 0, t: 40, b: 0 },
			paper_bgcolor: 'transparent'
		};

		const config = { responsive: true, displayModeBar: false };

		Plotly.newPlot(plotDiv, [trace], layout, config);
	}

	onMount(async () => {
		if (!isWebGLAvailable()) {
			webglUnavailable = true;
			return;
		}
		PlotlyModule = await import('plotly.js-gl3d-dist-min');
		renderChart();
	});

	onDestroy(() => {
		const Plotly = getPlotly();
		if (Plotly && plotDiv) {
			Plotly.purge(plotDiv);
		}
	});

	// Reactive updates when results or axes change
	$effect(() => {
		// Capture reactive dependencies
		const _results = results;
		const _xAxis = xAxis;
		const _yAxis = yAxis;

		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;

		const grid = toSurfaceGrid(_results, _xAxis, _yAxis);

		const trace = {
			type: 'surface',
			x: grid.x,
			y: grid.y,
			z: grid.z,
			colorscale: COLORSCALE,
			hovertemplate: '%{x} x %{y}<br>Energy: %{z:.4f} J/tok<extra></extra>'
		};

		const layout = {
			scene: {
				camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
				xaxis: { title: grid.xLabel },
				yaxis: { title: grid.yLabel },
				zaxis: { title: 'Energy (J/token)' }
			},
			margin: { l: 0, r: 0, t: 40, b: 0 },
			paper_bgcolor: 'transparent'
		};

		const config = { responsive: true, displayModeBar: false };

		Plotly.react(plotDiv, [trace], layout, config);
	});

	function handleXAxisChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val === yAxis) return; // prevent same axis
		xAxis = val;
	}

	function handleYAxisChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val === xAxis) return; // prevent same axis
		yAxis = val;
	}
</script>

{#if webglUnavailable}
	<div class="fallback-notice">
		<p class="fallback-text">3D view requires WebGL. Showing 2D heatmap instead.</p>
	</div>
	<ConfigHeatmapInteractive allResults={results} />
{:else}
	<div class="surface-controls">
		<label class="axis-label">
			X Axis
			<select class="axis-select" value={xAxis} onchange={handleXAxisChange}>
				{#each AXIS_OPTIONS as opt (opt.value)}
					<option value={opt.value} disabled={opt.value === yAxis}>{opt.label}</option>
				{/each}
			</select>
		</label>
		<label class="axis-label">
			Y Axis
			<select class="axis-select" value={yAxis} onchange={handleYAxisChange}>
				{#each AXIS_OPTIONS as opt (opt.value)}
					<option value={opt.value} disabled={opt.value === xAxis}>{opt.label}</option>
				{/each}
			</select>
		</label>
	</div>
	<div
		class="chart-container"
		bind:this={plotDiv}
		role="img"
		aria-label="3D energy surface plot: two horizontal axes represent configurable dimensions (e.g. precision and batch size) and the vertical axis shows energy consumption in joules per token. The surface is coloured on a blue-to-red scale — blue valleys indicate efficient configurations and red peaks indicate wasteful ones."
	></div>
{/if}

<style>
	.fallback-notice {
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.fallback-text {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.surface-controls {
		display: flex;
		gap: var(--space-6);
		margin-bottom: var(--space-4);
		flex-wrap: wrap;
	}

	.axis-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		color: var(--color-text-muted);
	}

	.axis-select {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--color-text);
		background: var(--color-surface);
		cursor: pointer;
	}

	.chart-container {
		width: 100%;
		min-height: 500px;
	}
</style>
