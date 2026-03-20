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
		selectedCell?: HeatmapCell | null;
		metric?: 'energy' | 'throughput';
		// Interactive callbacks
		onCellHover?: (_cell: HeatmapCell | null, _x: number, _y: number) => void;
		onCellClick?: (_cell: HeatmapCell) => void;
		// Zoom reset trigger (increment to reset zoom externally)
		zoomResetTrigger?: number;
	}

	const {
		cells,
		revealProgress = 1,
		width = 560,
		height = 400,
		interactive = false,
		selectedCell = null,
		metric = 'energy',
		onCellHover,
		onCellClick,
		zoomResetTrigger = 0
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

	// Colour scale: depends on metric
	const energyValues = $derived(cells.map((c) => c.energy));
	const throughputValues = $derived(cells.map((c) => c.throughput));
	const minEnergy = $derived(energyValues.length > 0 ? Math.min(...energyValues) : 0);
	const maxEnergy = $derived(energyValues.length > 0 ? Math.max(...energyValues) : 1);
	const minThroughput = $derived(throughputValues.length > 0 ? Math.min(...throughputValues) : 0);
	const maxThroughput = $derived(throughputValues.length > 0 ? Math.max(...throughputValues) : 1);

	// Energy: RdBu diverging (high = red/wasteful). Throughput: sequential Blues (high = blue/good).
	const colorScale = $derived(
		metric === 'energy'
			? d3.scaleSequential(d3.interpolateRdBu).domain([maxEnergy, minEnergy])
			: d3.scaleSequential(d3.interpolateBlues).domain([minThroughput, maxThroughput])
	);

	function cellColor(cell: HeatmapCell): string {
		return metric === 'energy'
			? (colorScale as d3.ScaleSequential<string>)(cell.energy)
			: (colorScale as d3.ScaleSequential<string>)(cell.throughput);
	}

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

	// Best and worst cells (by energy)
	const worstCell = $derived(sortedCells[0]);
	const bestCell = $derived(sortedCells[sortedCells.length - 1]);

	// Axis tick rendering
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
		xScale.domain();
		yScale.domain();
		updateAxes();
	});

	// ── Zoom ────────────────────────────────────────────────────────────────
	let svgEl: SVGSVGElement;
	let zoomGroupEl: SVGGElement;
	let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let zoomTransform = $state(d3.zoomIdentity);

	$effect(() => {
		if (!interactive || !svgEl || !zoomGroupEl) return;

		zoomBehavior = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 4])
			.translateExtent([
				[0, 0],
				[width, height]
			])
			.on('zoom', (event) => {
				zoomTransform = event.transform;
				d3.select(zoomGroupEl).attr('transform', event.transform.toString());
			});

		d3.select(svgEl).call(zoomBehavior);

		// Clean up on destroy
		return () => {
			d3.select(svgEl).on('.zoom', null);
		};
	});

	// Reset zoom when trigger changes
	$effect(() => {
		if (zoomResetTrigger >= 0 && zoomBehavior && svgEl) {
			d3.select(svgEl).call(zoomBehavior.transform, d3.zoomIdentity);
		}
	});

	function handleResetZoom() {
		if (zoomBehavior && svgEl) {
			d3.select(svgEl).transition().duration(250).call(zoomBehavior.transform, d3.zoomIdentity);
		}
	}

	// ── Interactive handlers ────────────────────────────────────────────────
	function handleCellMouseover(event: MouseEvent, cell: HeatmapCell) {
		if (!interactive) return;
		onCellHover?.(cell, event.offsetX + 12, event.offsetY - 8);
	}

	function handleCellMouseout() {
		if (!interactive) return;
		onCellHover?.(null, 0, 0);
	}

	function handleCellClick(cell: HeatmapCell) {
		if (!interactive) return;
		onCellClick?.(cell);
	}

	function handleCellTouchstart(event: TouchEvent, cell: HeatmapCell) {
		if (!interactive) return;
		const touch = event.touches[0];
		const rect = (event.currentTarget as Element).getBoundingClientRect();
		onCellHover?.(cell, touch.clientX - rect.left + 12, touch.clientY - rect.top - 8);
	}

	// ── Contour threshold lines ─────────────────────────────────────────────
	const THRESHOLDS = [2, 4, 8];

	function getContourLines() {
		if (cells.length === 0) return [];
		const lines: { y1: number; y2: number; x1: number; x2: number; label: string }[] = [];
		const minE = minEnergy;

		THRESHOLDS.forEach((threshold) => {
			const cutoff = minE * threshold;
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

				if ((prevAvg >= cutoff && currAvg < cutoff) || (prevAvg < cutoff && currAvg >= cutoff)) {
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

	function isSelectedCell(cell: HeatmapCell): boolean {
		if (!selectedCell) return false;
		return cell.precision === selectedCell.precision && cell.batch_size === selectedCell.batch_size;
	}
</script>

<div class="heatmap-container" style="position: relative;">
	<!-- Reset zoom button -->
	{#if interactive && zoomTransform.k > 1}
		<div class="zoom-reset-wrapper">
			<button class="zoom-reset-btn" onclick={handleResetZoom} type="button">
				Reset zoom
			</button>
		</div>
	{/if}

	<svg
		bind:this={svgEl}
		viewBox="0 0 {width} {height}"
		{width}
		{height}
		class="heatmap-svg"
		class:heatmap-svg--interactive={interactive}
		role="img"
		aria-label="Configuration energy heatmap"
	>
		<g transform="translate({MARGIN.left},{MARGIN.top})">
			<!-- Zoom group: receives d3 transform -->
			<g bind:this={zoomGroupEl} class="zoom-group">
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
					{@const isSelected = isSelectedCell(cell)}
					{@const revealOrder = sortedCells.findIndex((c) => c.precision === cell.precision && c.batch_size === cell.batch_size)}
					<g
						class="cell-group"
						class:cell-group--interactive={interactive}
						role={interactive ? 'button' : undefined}
						tabindex={interactive ? 0 : undefined}
						aria-label={interactive ? `${cell.label}: ${cell.energy.toFixed(4)} J/token` : undefined}
						onmouseover={interactive ? (e) => handleCellMouseover(e, cell) : undefined}
						onmouseout={interactive ? handleCellMouseout : undefined}
						onclick={interactive ? () => handleCellClick(cell) : undefined}
						onkeydown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCellClick(cell); } : undefined}
						ontouchstart={interactive ? (e) => handleCellTouchstart(e, cell) : undefined}
					>
						<rect
							{x}
							{y}
							width={w}
							height={h}
							fill={cellColor(cell)}
							stroke={isSelected
								? 'var(--color-primary)'
								: isWorst
									? 'var(--color-energy-wasteful)'
									: isBest
										? 'var(--color-energy-efficient)'
										: 'transparent'}
							stroke-width={isSelected ? 3 : isWorst || isBest ? 2 : 0}
							stroke-dasharray={!isSelected && (isWorst || isBest) ? '4 2' : undefined}
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
							>Best</text>
						{/if}
						{#if isWorst && isVisible}
							<text
								x={x + w / 2}
								y={y - 4}
								text-anchor="middle"
								font-size="10"
								fill="var(--color-energy-wasteful)"
								font-weight="bold"
							>Worst</text>
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
			</g>

			<!-- Axes rendered outside zoom group so labels stay fixed -->
			<!-- X Axis -->
			<g bind:this={xAxisEl} transform="translate(0, {innerHeight})" class="axis-group" />
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

	.heatmap-svg--interactive {
		cursor: grab;
	}

	.heatmap-svg--interactive:active {
		cursor: grabbing;
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

	.cell-group--interactive {
		cursor: pointer;
	}

	.zoom-reset-wrapper {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		z-index: 10;
		pointer-events: none;
	}

	.zoom-reset-btn {
		pointer-events: auto;
		padding: var(--space-1) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
		transition: background-color var(--transition-fast);
	}

	.zoom-reset-btn:hover {
		background: var(--color-bg);
		color: var(--color-primary);
	}
</style>
