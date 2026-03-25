<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PCAProjection } from '$lib/data/types.js';

	interface Props {
		pcaProjection: PCAProjection;
		filteredExperimentIds: string[];
	}

	const { pcaProjection, filteredExperimentIds }: Props = $props();

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

	function scaleToRange(value: number, min: number, max: number, outMin: number, outMax: number) {
		if (max === min) return (outMin + outMax) / 2;
		return outMin + ((value - min) / (max - min)) * (outMax - outMin);
	}

	function buildTrace() {
		const points = pcaProjection.points;

		const throughputs = points.map((p) => p.throughput);
		const minT = Math.min(...throughputs);
		const maxT = Math.max(...throughputs);

		const filteredSet = new Set(filteredExperimentIds);

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
			hovertemplate:
				'PC1: %{x:.2f}<br>PC2: %{y:.2f}<br>PC3: %{z:.2f}<br>Energy: %{customdata[0]:.4f} J/tok<br>%{customdata[1]} / %{customdata[2]} / bs%{customdata[3]}<extra></extra>',
			customdata: points.map((p) => [p.energy, p.backend, p.precision, p.batch_size])
		};
	}

	function buildLayout() {
		const variance = pcaProjection.explained_variance;
		return {
			scene: {
				camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
				xaxis: { title: `PC1 (${(variance[0] * 100).toFixed(1)}%)` },
				yaxis: { title: `PC2 (${(variance[1] * 100).toFixed(1)}%)` },
				zaxis: { title: `PC3 (${(variance[2] * 100).toFixed(1)}%)` }
			},
			margin: { l: 0, r: 0, t: 40, b: 0 },
			paper_bgcolor: 'transparent'
		};
	}

	function renderChart() {
		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;
		const config = { responsive: true, displayModeBar: false };
		Plotly.newPlot(plotDiv, [buildTrace()], buildLayout(), config);
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
		// Capture reactive dependencies
		const _ids = filteredExperimentIds;
		const _projection = pcaProjection;

		const Plotly = getPlotly();
		if (!Plotly || !plotDiv) return;

		void _projection;
		void _ids;

		const config = { responsive: true, displayModeBar: false };
		Plotly.react(plotDiv, [buildTrace()], buildLayout(), config);
	});
</script>

{#if webglUnavailable}
	<div class="fallback-notice">
		<p class="fallback-text">
			PCA projection requires WebGL. This visualisation is not available on your device.
		</p>
	</div>
{:else}
	<div class="chart-container" bind:this={plotDiv}></div>
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
