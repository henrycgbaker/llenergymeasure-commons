<script lang="ts">
	import {
		exportChartAsPng,
		exportChartAsSvg,
		exportPlotlyPng
	} from '$lib/utils/chartExport.js';

	interface Props {
		chartType: 'svg' | 'plotly';
		exportContainerRef?: HTMLElement;
		svgRef?: SVGSVGElement;
		plotlyRef?: HTMLElement;
		plotly?: unknown;
		slug: string;
		chartTitle: string;
	}

	const {
		chartType,
		exportContainerRef,
		svgRef,
		plotlyRef,
		plotly,
		slug,
		chartTitle
	}: Props = $props();

	const ATTRIBUTION = 'Henry Baker . Hertie School';

	let exportingPng = $state(false);
	let exportingSvg = $state(false);

	async function handleExportPng() {
		exportingPng = true;
		try {
			const filename = `llem-${slug}.png`;
			if (chartType === 'plotly' && plotlyRef && plotly) {
				await exportPlotlyPng(plotlyRef, filename, plotly, chartTitle, ATTRIBUTION);
			} else if (exportContainerRef) {
				await exportChartAsPng(exportContainerRef, filename);
			}
		} finally {
			exportingPng = false;
		}
	}

	async function handleExportSvg() {
		if (chartType !== 'svg' || !svgRef) return;
		exportingSvg = true;
		try {
			await exportChartAsSvg(svgRef, `llem-${slug}.svg`);
		} finally {
			exportingSvg = false;
		}
	}
</script>

<div class="export-buttons">
	<button
		class="export-btn"
		onclick={handleExportPng}
		disabled={exportingPng}
		type="button"
		aria-label="Download chart as PNG"
	>
		{exportingPng ? 'Exporting…' : 'Download PNG'}
	</button>

	{#if chartType === 'svg'}
		<button
			class="export-btn"
			onclick={handleExportSvg}
			disabled={exportingSvg}
			type="button"
			aria-label="Download chart as SVG"
		>
			{exportingSvg ? 'Exporting…' : 'Download SVG'}
		</button>
	{/if}
</div>

<style>
	.export-buttons {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		margin-top: var(--space-4);
	}

	.export-btn {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.export-btn:hover:not(:disabled) {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.export-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
</style>
