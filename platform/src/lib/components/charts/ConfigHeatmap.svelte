<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { HeatmapCell } from '$lib/data/types.js';

	interface Props {
		cells: HeatmapCell[];
		revealProgress?: number; // 0-1, controls how many cells are visible (worst-first)
		width?: number;
		height?: number;
		interactive?: boolean;
	}

	const {
		cells,
		revealProgress = 1,
		width = 560,
		height = 400,
		interactive = false
	}: Props = $props();

	const MARGIN = { top: 30, right: 40, bottom: 50, left: 70 };

	// Axis dimensions
	const innerWidth = $derived(width - MARGIN.left - MARGIN.right);
	const innerHeight = $derived(height - MARGIN.top - MARGIN.bottom);

	// Unique axis values derived from cells
	const precisions = $derived(
		(() => {
			const order = ['fp32', 'fp16', 'bf16', 'int8'];
			const present = [...new Set(cells.map((c) => c.precision))];
			// Sort by defined order; unknown precisions go at end
			return present.sort((a, b) => {
				const ai = order.indexOf(a);
				const bi = order.indexOf(b);
				return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
			});
		})()
	);

	const batchSizes = $derived(
		[...new Set(cells.map((c) => c.batch_size))].sort((a, b) => a - b).map(String)
	);

	// D3 band scales
	const xScale = $derived(d3.scaleBand().domain(precisions).range([0, innerWidth]).padding(0.05));

	const yScale = $derived(
		d3.scaleBand().domain(batchSizes).range([innerHeight, 0]).padding(0.05)
	);

	// Colour scale: RdBu diverging (inverted so high energy = red, low = blue)
	const energyValues = $derived(cells.map((c) => c.energy));
	const minEnergy = $derived(energyValues.length > 0 ? Math.min(...energyValues) : 0);
	const maxEnergy = $derived(energyValues.length > 0 ? Math.max(...energyValues) : 1);

	// d3.interpolateRdBu: 0=blue (efficient), 1=red (wasteful)
	// We invert the domain so high energy maps to red (low t value in RdBu = blue)
	const colorScale = $derived(
		d3.scaleSequential(d3.interpolateRdBu).domain([maxEnergy, minEnergy])
	);

	// Sort cells by energy descending for reveal order (worst = red first)
	const sortedCells = $derived([...cells].sort((a, b) => b.energy - a.energy));

	// How many cells to show based on revealProgress
	const visibleCount = $derived(Math.ceil(revealProgress * sortedCells.length));

	// Set of visible cell keys
	const visibleKeys = $derived(
		new Set(
			sortedCells
				.slice(0, visibleCount)
				.map((c) => `${c.precision}-${c.batch_size}`)
		)
	);

	// Best and worst cells
	const worstCell = $derived(sortedCells[0]);
	const bestCell = $derived(sortedCells[sortedCells.length - 1]);

	// Axis tick rendering (via use:action pattern for D3 axis)
	let xAxisEl: SVGGElement;
	let yAxisEl: SVGGElement;

	function updateAxes() {
		if (!xAxisEl || !yAxisEl) return;
		d3.select(xAxisEl).call(d3.axisBottom(xScale).tickSizeOuter(0));
		d3.select(yAxisEl).call(
			d3.axisLeft(yScale).tickFormat((d) => `batch ${d}`).tickSizeOuter(0)
		);
	}

	onMount(() => {
		updateAxes();
	});

	$effect(() => {
		// Re-render axes when scales change
		// Accessing xScale and yScale subscribes to their changes
		xScale.domain();
		yScale.domain();
		updateAxes();
	});

	// Tooltip state (for interactive mode)
	let hoveredCell: HeatmapCell | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function handleCellMouseover(event: MouseEvent, cell: HeatmapCell) {
		if (!interactive) return;
		hoveredCell = cell;
		tooltipX = event.offsetX + 12;
		tooltipY = event.offsetY - 8;
	}

	function handleCellMouseout() {
		if (!interactive) return;
		hoveredCell = null;
	}

	// Contour threshold lines at 2x, 4x, 8x ratios relative to best
	// For a small discrete grid, we draw threshold rule lines between cells
	// rather than d3-contour (which needs a continuous grid)
	// Threshold line logic: find column/row boundaries where ratio crosses thresholds
	// This is a simplified approach: draw a dashed horizontal line between batch sizes
	// where the median ratio crosses the 2x/4x thresholds
	const THRESHOLDS = [2, 4, 8];

	function getContourLines() {
		if (cells.length === 0) return [];
		const lines: { y1: number; y2: number; x1: number; x2: number; label: string }[] = [];
		const minE = minEnergy;

		THRESHOLDS.forEach((threshold) => {
			const cutoff = minE * threshold;
			// Find transitions in batch size (y-axis): where average energy crosses threshold
			batchSizes.forEach((batchStr, i) => {
				if (i === 0) return;
				const prevBatch = Number(batchSizes[i - 1]);
				const currBatch = Number(batchStr);

				const prevEnergies = cells
					.filter((c) => c.batch_size === prevBatch)
					.map((c) => c.energy);
				const currEnergies = cells
					.filter((c) => c.batch_size === currBatch)
					.map((c) => c.energy);

				const prevAvg = prevEnergies.reduce((s, e) => s + e, 0) / (prevEnergies.length || 1);
				const currAvg = currEnergies.reduce((s, e) => s + e, 0) / (currEnergies.length || 1);

				// Check if threshold is crossed between these rows
				if ((prevAvg >= cutoff && currAvg < cutoff) || (prevAvg < cutoff && currAvg >= cutoff)) {
					// Draw horizontal line at the midpoint between the two rows
					const y1top = yScale(batchStr) ?? 0;
					const prevBandY = yScale(batchSizes[i - 1]) ?? 0;
					const bandH = yScale.bandwidth();
					const lineY = prevBandY + bandH + (y1top - prevBandY - bandH) / 2;
					lines.push({
						x1: 0,
						x2: innerWidth,
						y1: lineY,
						y2: lineY,
						label: `${threshold}x`
					});
				}
			});
		});

		return lines;
	}

	const contourLines = $derived(getContourLines());
</script>

<div class="heatmap-container" style="position: relative;">
	<svg
		viewBox="0 0 {width} {height}"
		{width}
		{height}
		class="heatmap-svg"
		role="img"
		aria-label="Configuration energy heatmap"
	>
		<g transform="translate({MARGIN.left},{MARGIN.top})">
			<!-- Cells -->
			{#each cells as cell (cell.precision + '-' + cell.batch_size)}
				{@const x = xScale(cell.precision) ?? 0}
				{@const y = yScale(String(cell.batch_size)) ?? 0}
				{@const w = xScale.bandwidth()}
				{@const h = yScale.bandwidth()}
				{@const key = `${cell.precision}-${cell.batch_size}`}
				{@const isVisible = visibleKeys.has(key)}
				{@const isWorst = cell.precision === worstCell?.precision && cell.batch_size === worstCell?.batch_size}
				{@const isBest = cell.precision === bestCell?.precision && cell.batch_size === bestCell?.batch_size}
				{@const revealOrder = sortedCells.findIndex((c) => c.precision === cell.precision && c.batch_size === cell.batch_size)}
				<g
					class="cell-group"
					onmouseover={interactive ? (e) => handleCellMouseover(e, cell) : undefined}
					onmouseout={interactive ? handleCellMouseout : undefined}
				>
					<rect
						{x}
						{y}
						width={w}
						height={h}
						fill={colorScale(cell.energy)}
						stroke={isWorst || isBest ? 'var(--color-text)' : 'transparent'}
						stroke-width={isWorst || isBest ? 2 : 0}
						rx="2"
						style="opacity: {isVisible ? 1 : 0}; transition: opacity 200ms ease {revealOrder * 30}ms;"
					/>
					<!-- Best/worst labels -->
					{#if isBest && isVisible}
						<text
							x={x + w / 2}
							y={y - 4}
							text-anchor="middle"
							font-size="10"
							fill="var(--color-energy-efficient)"
							font-weight="bold"
						>best</text>
					{/if}
					{#if isWorst && isVisible}
						<text
							x={x + w / 2}
							y={y - 4}
							text-anchor="middle"
							font-size="10"
							fill="var(--color-energy-wasteful)"
							font-weight="bold"
						>worst</text>
					{/if}
				</g>
			{/each}

			<!-- Contour threshold lines -->
			{#each contourLines as line, i (i)}
				<line
					x1={line.x1}
					x2={line.x2}
					y1={line.y1}
					y2={line.y2}
					stroke="var(--color-text)"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.4"
				/>
				<text
					x={line.x2 + 4}
					y={line.y1 + 4}
					font-size="9"
					fill="var(--color-text-muted)"
				>{line.label}</text>
			{/each}

			<!-- X Axis -->
			<g bind:this={xAxisEl} transform="translate(0, {innerHeight})" class="axis-group" />
			<!-- X Axis label -->
			<text
				x={innerWidth / 2}
				y={innerHeight + MARGIN.bottom - 6}
				text-anchor="middle"
				font-size="12"
				fill="var(--color-text-muted)"
			>Precision</text>

			<!-- Y Axis -->
			<g bind:this={yAxisEl} class="axis-group" />
		</g>
	</svg>

	<!-- Tooltip (interactive mode only) -->
	{#if interactive && hoveredCell}
		<div
			class="tooltip"
			style="left: {tooltipX}px; top: {tooltipY}px;"
			role="tooltip"
		>
			<div class="tooltip__label">{hoveredCell.label}</div>
			<div class="tooltip__energy">
				{hoveredCell.energy.toExponential(3)} J/token
			</div>
			<div class="tooltip__ratio">
				{hoveredCell.ratioVsBest.toFixed(1)}x vs best
			</div>
		</div>
	{/if}
</div>

<style>
	.heatmap-container {
		width: 100%;
	}

	.heatmap-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	:global(.axis-group text) {
		fill: var(--color-text-muted);
		font-size: 0.75rem;
	}

	:global(.axis-group line),
	:global(.axis-group path) {
		stroke: var(--color-border);
	}

	.cell-group {
		cursor: default;
	}

	.cell-group:global([role='button']) {
		cursor: pointer;
	}

	.tooltip {
		position: absolute;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		pointer-events: none;
		font-size: var(--text-sm);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		z-index: 10;
		white-space: nowrap;
	}

	.tooltip__label {
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-1);
	}

	.tooltip__energy {
		color: var(--color-text-muted);
	}

	.tooltip__ratio {
		color: var(--color-energy-wasteful);
		font-weight: var(--weight-medium);
	}
</style>
