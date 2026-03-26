<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PCAProjection } from '$lib/data/types.js';
	import { getDimensionLabel, formatDimensionValue } from '$lib/data/dimensions.js';

	interface Props {
		pcaProjection: PCAProjection;
		selectedBackend: string | null;
		filteredExperimentIds: string[];
	}

	const { pcaProjection, selectedBackend, filteredExperimentIds }: Props = $props();

	// RdBu colour scale matching design tokens
	const COLORSCALE: [number, string][] = [
		[0, '#2166ac'],
		[0.5, '#f7f7f7'],
		[1, '#d6604d']
	];

	let plotDiv = $state<HTMLDivElement | undefined>(undefined);
	let webglUnavailable = $state(false);
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

	function scaleToRange(value: number, min: number, max: number, outMin: number, outMax: number) {
		if (max === min) return (outMin + outMax) / 2;
		return outMin + ((value - min) / (max - min)) * (outMax - outMin);
	}

	// Get the active backend data from the per-backend PCA structure
	const activeBackendData = $derived(() => {
		const backend = selectedBackend ?? Object.keys(pcaProjection.backends)[0];
		return pcaProjection.backends[backend] ?? null;
	});

	function buildTrace() {
		const backendData = activeBackendData();
		if (!backendData) return null;

		const points = backendData.points;
		const throughputs = points.map((p) => p.throughput);
		const minT = Math.min(...throughputs);
		const maxT = Math.max(...throughputs);

		const filteredSet = new Set(filteredExperimentIds);

		// Build hover text from dynamic dimensions
		const hoverTexts = points.map((p) => {
			const dimLines = Object.entries(p.dimensions)
				.map(([k, v]) => `${getDimensionLabel(k)}: ${formatDimensionValue(k, v)}`)
				.join('<br>');
			return `PC1: ${p.pc1.toFixed(2)}<br>PC2: ${p.pc2.toFixed(2)}<br>PC3: ${p.pc3.toFixed(2)}<br>Energy: ${p.energy.toFixed(4)} J/tok<br>${dimLines}`;
		});

		return {
			type: 'scatter3d',
			mode: 'markers',
			x: points.map((p) => p.pc1),
			y: points.map((p) => p.pc2),
			z: points.map((p) => p.pc3),
			marker: {
				color: points.map((p) => p.energy),
				colorscale: COLORSCALE,
				size: points.map((p) => scaleToRange(p.throughput, minT, maxT, 4, 12)),
				opacity: points.map((p) => (filteredSet.has(p.experiment_id) ? 1.0 : 0.15)),
				colorbar: { title: 'Energy (J/tok)', thickness: 12 }
			},
			hovertext: hoverTexts,
			hoverinfo: 'text'
		};
	}

	function buildLayout() {
		const backendData = activeBackendData();
		if (!backendData) return {};

		const variance = backendData.explained_variance;
		return {
			scene: {
				camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
				xaxis: { title: `PC1 (${(variance[0] * 100).toFixed(1)}%)` },
				yaxis: { title: `PC2 (${((variance[1] ?? 0) * 100).toFixed(1)}%)` },
				zaxis: { title: `PC3 (${((variance[2] ?? 0) * 100).toFixed(1)}%)` }
			},
			margin: { l: 0, r: 0, t: 40, b: 0 },
			paper_bgcolor: 'transparent'
		};
	}

	function renderChart() {
		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;
		const trace = buildTrace();
		if (!trace) return;
		const config = { responsive: true, displayModeBar: false };
		Plotly.newPlot(plotDiv, [trace], buildLayout(), config);
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

	// Reactive update when filter or projection changes
	$effect(() => {
		const _ids = filteredExperimentIds;
		const _projection = pcaProjection;
		const _backend = selectedBackend;

		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;

		void _projection;
		void _ids;
		void _backend;

		const trace = buildTrace();
		if (!trace) return;
		const config = { responsive: true, displayModeBar: false };
		Plotly.react(plotDiv, [trace], buildLayout(), config);
	});
</script>

{#if webglUnavailable}
	<div class="fallback-notice">
		<p class="fallback-text">
			PCA projection requires WebGL. This visualisation is not available on your device.
		</p>
	</div>
{:else}
	<div
		class="chart-container"
		bind:this={plotDiv}
		role="img"
		aria-label="3D PCA projection scatter plot: each configuration is plotted as a dot in principal component space. Dot colour encodes energy per token on a blue-to-red scale. Dot size encodes throughput. Proximity indicates similar configuration profiles."
	></div>
{/if}

<style>
	.fallback-notice {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 350px;
		background: var(--color-bg);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}

	.fallback-text {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
		max-width: 40ch;
	}

	.chart-container {
		width: 100%;
		min-height: 500px;
	}
</style>
