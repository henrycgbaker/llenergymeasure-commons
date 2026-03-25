<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { ParallelRecord } from '$lib/data/types.js';

	interface Props {
		data: ParallelRecord[];
		onBrush: (_ranges: {
			energyRange?: [number, number] | null;
			batchRange?: [number, number] | null;
		}) => void;
	}

	const { data, onBrush }: Props = $props();

	let svgEl: SVGSVGElement;
	let containerEl: HTMLDivElement;
	let width = $state(800);
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipRecord = $state<ParallelRecord | null>(null);

	const MARGIN = { top: 40, right: 30, bottom: 20, left: 30 };
	const HEIGHT_DESKTOP = 450;
	const HEIGHT_MOBILE = 300;

	// Responsive height
	const height = $derived(width < 600 ? HEIGHT_MOBILE : HEIGHT_DESKTOP);
	const innerWidth = $derived(width - MARGIN.left - MARGIN.right);
	const innerHeight = $derived(height - MARGIN.top - MARGIN.bottom);

	// Axis definitions — order is mutable (drag-reorder)
	type AxisKey = keyof ParallelRecord;
	let axisOrder = $state<AxisKey[]>([
		'precision',
		'batch_size',
		'backend',
		'attn_implementation',
		'avg_energy_per_token_j'
	]);

	const AXIS_LABELS: Record<AxisKey, string> = {
		experiment_id: 'ID',
		precision: 'Precision',
		batch_size: 'Batch Size',
		backend: 'Backend',
		attn_implementation: 'Attention',
		avg_energy_per_token_j: 'Energy (J/tok)'
	};

	// Scales: categorical axes use scalePoint, numeric use scaleLinear
	function buildScale(key: AxisKey, records: ParallelRecord[], h: number) {
		if (key === 'batch_size' || key === 'avg_energy_per_token_j') {
			const vals = records.map((r) => r[key] as number);
			const [lo, hi] = d3.extent(vals) as [number, number];
			return d3.scaleLinear().domain([lo, hi]).range([h, 0]).nice();
		} else {
			const vals = [...new Set(records.map((r) => String(r[key])))].sort();
			return d3.scalePoint().domain(vals).range([h, 0]).padding(0.2);
		}
	}

	// Colour scale: energy-based RdBu (low=blue, high=red)
	function buildColorScale(records: ParallelRecord[]) {
		const vals = records.map((r) => r.avg_energy_per_token_j);
		const [lo, hi] = d3.extent(vals) as [number, number];
		// Reversed domain: lo=blue, hi=red
		return d3.scaleSequential(d3.interpolateRdBu).domain([hi, lo]);
	}

	// Map a record's value for a given axis key to a pixel y coordinate
	function getY(
		key: AxisKey,
		record: ParallelRecord,
		scale: d3.ScaleLinear<number, number> | d3.ScalePoint<string>
	): number {
		if (key === 'batch_size' || key === 'avg_energy_per_token_j') {
			return (scale as d3.ScaleLinear<number, number>)(record[key] as number) ?? 0;
		} else {
			return (scale as d3.ScalePoint<string>)(String(record[key])) ?? 0;
		}
	}

	// Build a polyline path for a record given the current axis order and x scale
	function buildPath(
		record: ParallelRecord,
		axes: AxisKey[],
		xScale: d3.ScalePoint<string>,
		scales: Map<AxisKey, d3.ScaleLinear<number, number> | d3.ScalePoint<string>>
	): string {
		const points = axes.map((key) => {
			const x = xScale(key) ?? 0;
			const scale = scales.get(key)!;
			const y = getY(key, record, scale);
			return [x, y] as [number, number];
		});
		return d3.line()(points) ?? '';
	}

	// D3 infrastructure — set up once in onMount
	let brushSelections = new Map<AxisKey, [number, number] | null>();

	onMount(() => {
		if (!svgEl || !containerEl) return;

		// ResizeObserver for responsive width
		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				width = entry.contentRect.width || 800;
			}
		});
		ro.observe(containerEl);

		// Initial draw
		setupSVG();

		return () => {
			ro.disconnect();
		};
	});

	// Track whether SVG structure has been set up
	let svgInitialised = false;

	function setupSVG() {
		if (!svgEl) return;

		const svg = d3.select(svgEl);
		svg.selectAll('*').remove();
		svgInitialised = false;

		const g = svg.append('g').attr('class', 'main-g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

		g.append('g').attr('class', 'lines-g');
		g.append('g').attr('class', 'axes-g');

		svgInitialised = true;
		drawChart();
	}

	function drawChart() {
		if (!svgEl || !svgInitialised) return;
		if (data.length === 0) return;

		const svg = d3.select(svgEl);
		const g = svg.select<SVGGElement>('.main-g');

		// Build x scale from current axis order
		const xScale = d3.scalePoint<string>()
			.domain(axisOrder as string[])
			.range([0, innerWidth])
			.padding(0);

		// Build per-axis scales
		const scales = new Map<AxisKey, d3.ScaleLinear<number, number> | d3.ScalePoint<string>>();
		for (const key of axisOrder) {
			scales.set(key, buildScale(key, data, innerHeight));
		}

		const colorScale = buildColorScale(data);

		// ── Lines ────────────────────────────────────────────────────────────
		const linesG = g.select<SVGGElement>('.lines-g');
		const paths = linesG.selectAll<SVGPathElement, ParallelRecord>('path.pc-line').data(data, (d) => d.experiment_id);

		paths.join(
			(enter) =>
				enter
					.append('path')
					.attr('class', 'pc-line')
					.attr('fill', 'none')
					.attr('stroke-width', 1.5)
					.attr('stroke-opacity', 0.4)
					.attr('stroke', (d) => colorScale(d.avg_energy_per_token_j))
					.attr('d', (d) => buildPath(d, axisOrder, xScale, scales))
					.on('mouseover', function (event: MouseEvent, d: ParallelRecord) {
						// Dim all, highlight this
						linesG.selectAll<SVGPathElement, ParallelRecord>('path.pc-line')
							.attr('stroke-opacity', 0.1)
							.attr('stroke-width', 1.5);
						d3.select(this)
							.attr('stroke-opacity', 1.0)
							.attr('stroke-width', 2.5)
							.raise();

						// Tooltip
						tooltipRecord = d;
						tooltipVisible = true;
						updateTooltipPosition(event);
					})
					.on('mousemove', function (event: MouseEvent) {
						updateTooltipPosition(event);
					})
					.on('mouseout', function () {
						linesG.selectAll<SVGPathElement, ParallelRecord>('path.pc-line')
							.attr('stroke-opacity', 0.4)
							.attr('stroke-width', 1.5);
						tooltipVisible = false;
						tooltipRecord = null;
					}),
			(update) =>
				update
					.attr('stroke', (d) => colorScale(d.avg_energy_per_token_j))
					.attr('d', (d) => buildPath(d, axisOrder, xScale, scales)),
			(exit) => exit.remove()
		);

		// ── Axes ─────────────────────────────────────────────────────────────
		const axesG = g.select<SVGGElement>('.axes-g');
		const axisGroups = axesG
			.selectAll<SVGGElement, AxisKey>('.axis-group')
			.data(axisOrder, (d) => d as string);

		const axisGroupsEnter = axisGroups
			.enter()
			.append('g')
			.attr('class', (d) => `axis-group axis-${d}`)
			.attr('transform', (d) => `translate(${xScale(d as string) ?? 0},0)`);

		const allAxisGroups = axisGroupsEnter.merge(axisGroups as d3.Selection<SVGGElement, AxisKey, SVGGElement, unknown>);

		// Update transform on existing groups (for drag-reorder)
		allAxisGroups.attr('transform', (d) => `translate(${xScale(d as string) ?? 0},0)`);

		// Remove old groups not in current order
		axisGroups.exit().remove();

		// Draw axis line + ticks for each group
		allAxisGroups.each(function (key) {
			const ag = d3.select<SVGGElement, AxisKey>(this);
			ag.selectAll('*').remove();

			const scale = scales.get(key)!;

			// Axis line
			ag.append('line')
				.attr('class', 'axis-line')
				.attr('y1', 0)
				.attr('y2', innerHeight)
				.attr('stroke', 'var(--color-text-muted)')
				.attr('stroke-width', 1);

			// Ticks
			if (key === 'batch_size' || key === 'avg_energy_per_token_j') {
				const linScale = scale as d3.ScaleLinear<number, number>;
				const ticks = linScale.ticks(5);
				ticks.forEach((t) => {
					const y = linScale(t);
					ag.append('line')
						.attr('x1', -4).attr('x2', 4)
						.attr('y1', y).attr('y2', y)
						.attr('stroke', 'var(--color-text-muted)')
						.attr('stroke-width', 1);

					ag.append('text')
						.attr('x', -8)
						.attr('y', y)
						.attr('dy', '0.35em')
						.attr('text-anchor', 'end')
						.attr('font-size', 'var(--text-xs)')
						.attr('fill', 'var(--color-text-muted)')
						.text(key === 'avg_energy_per_token_j' ? t.toFixed(4) : String(t));
				});
			} else {
				const ptScale = scale as d3.ScalePoint<string>;
				ptScale.domain().forEach((val) => {
					const y = ptScale(val) ?? 0;
					ag.append('line')
						.attr('x1', -4).attr('x2', 4)
						.attr('y1', y).attr('y2', y)
						.attr('stroke', 'var(--color-text-muted)')
						.attr('stroke-width', 1);

					ag.append('text')
						.attr('x', -8)
						.attr('y', y)
						.attr('dy', '0.35em')
						.attr('text-anchor', 'end')
						.attr('font-size', 'var(--text-xs)')
						.attr('fill', 'var(--color-text-muted)')
						.text(val);
				});
			}

			// Axis label (draggable target)
			const label = ag.append('text')
				.attr('class', 'axis-label')
				.attr('y', -14)
				.attr('text-anchor', 'middle')
				.attr('font-family', 'var(--font-body)')
				.attr('font-size', 'var(--text-sm)')
				.attr('font-weight', 'var(--weight-bold)')
				.attr('fill', 'var(--color-text)')
				.attr('cursor', 'grab')
				.text(AXIS_LABELS[key]);

			// Drag-reorder on label
			let dragStartX = 0;
			let dragStartOrder: AxisKey[] = [];

			const drag = d3.drag<SVGTextElement, AxisKey>()
				.on('start', function (event) {
					dragStartX = xScale(key as string) ?? 0;
					dragStartOrder = [...axisOrder];
					d3.select(this).attr('cursor', 'grabbing');
				})
				.on('drag', function (event) {
					const currentX = dragStartX + event.x - (xScale(key as string) ?? 0) + event.x;
					// Move axis group while dragging
					ag.attr('transform', `translate(${dragStartX + event.x},0)`);

					// Determine new order by comparing drag position to other axis positions
					const newOrder = [...dragStartOrder];
					const draggedIdx = newOrder.indexOf(key);
					const targetX = dragStartX + event.x;

					// Find insertion position
					let insertIdx = draggedIdx;
					for (let i = 0; i < newOrder.length; i++) {
						if (i === draggedIdx) continue;
						const otherX = xScale(newOrder[i] as string) ?? 0;
						if (i < draggedIdx && targetX < otherX + (xScale.step() / 2)) {
							insertIdx = i;
							break;
						} else if (i > draggedIdx && targetX > otherX - (xScale.step() / 2)) {
							insertIdx = i;
						}
					}

					if (insertIdx !== draggedIdx) {
						newOrder.splice(draggedIdx, 1);
						newOrder.splice(insertIdx, 0, key);
					}
					void currentX; // suppress unused var warning
				})
				.on('end', function (event) {
					d3.select(this).attr('cursor', 'grab');

					// Compute final insertion position
					const targetX = dragStartX + event.x;
					const newOrder = [...dragStartOrder];
					const draggedIdx = newOrder.indexOf(key);

					// Build sorted list of (key, xPos) for non-dragged items
					const others = newOrder
						.filter((k) => k !== key)
						.map((k) => ({ key: k, x: xScale(k as string) ?? 0 }));

					let insertIdx = 0;
					for (let i = 0; i < others.length; i++) {
						if (targetX > others[i].x) insertIdx = i + 1;
					}

					newOrder.splice(draggedIdx, 1);
					newOrder.splice(insertIdx, 0, key);
					axisOrder = newOrder;

					// Trigger redraw
					setupSVG();
				});

			label.call(drag);

			// ── Brush on numeric axes ─────────────────────────────────────────
			if (key === 'batch_size' || key === 'avg_energy_per_token_j') {
				const linScale = scale as d3.ScaleLinear<number, number>;

				const brush = d3.brushY()
					.extent([[-8, 0], [8, innerHeight]])
					.on('brush end', function (event) {
						if (!event.selection) {
							// Brush cleared
							brushSelections.set(key, null);
						} else {
							const [py0, py1] = event.selection as [number, number];
							const lo = linScale.invert(py1); // py1 > py0 in pixel space = lower domain val
							const hi = linScale.invert(py0);
							brushSelections.set(key, [lo, hi]);
						}

						const energySel = brushSelections.get('avg_energy_per_token_j') ?? null;
						const batchSel = brushSelections.get('batch_size') ?? null;
						onBrush({
							energyRange: energySel,
							batchRange: batchSel
						});
					});

				(ag.append('g').attr('class', 'brush') as unknown as d3.Selection<SVGGElement, unknown, null, undefined>).call(brush);

				// Style brush selection rect
				ag.select<SVGGElement>('.brush').select('.selection')
					.attr('fill', 'var(--color-primary)')
					.attr('fill-opacity', 0.1)
					.attr('stroke', 'var(--color-primary)')
					.attr('stroke-opacity', 0.5);
			}
		});
	}

	// Update lines when data prop changes (without re-creating brushes)
	$effect(() => {
		// Access data to register dependency
		const _d = data;
		if (svgInitialised && svgEl) {
			// Re-setup the entire SVG when data changes since scales and lines both depend on data
			// This is safe because brushes are cleared when data changes (filter was applied externally)
			setupSVG();
		}
		void _d;
	});

	// Re-draw when dimensions change
	$effect(() => {
		const _w = innerWidth;
		const _h = innerHeight;
		if (svgInitialised && svgEl && _w > 0 && _h > 0) {
			setupSVG();
		}
		void _w;
		void _h;
	});

	function updateTooltipPosition(event: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		let x = event.clientX - rect.left + 12;
		let y = event.clientY - rect.top - 10;

		// Flip near right edge
		if (x + 220 > rect.width) x = event.clientX - rect.left - 230;
		// Flip near bottom edge
		if (y + 120 > rect.height) y = event.clientY - rect.top - 130;

		tooltipX = x;
		tooltipY = y;
	}
</script>

<div class="pc-container" bind:this={containerEl}>
	<svg
		bind:this={svgEl}
		class="pc-svg"
		{width}
		{height}
		aria-label="Parallel coordinates chart showing configuration dimensions"
		role="img"
	></svg>

	{#if tooltipVisible && tooltipRecord}
		<div
			class="pc-tooltip"
			style="left: {tooltipX}px; top: {tooltipY}px;"
			aria-live="polite"
		>
			<div class="pc-tooltip__row pc-tooltip__row--header">
				<span class="pc-tooltip__label">Backend</span>
				<span class="pc-tooltip__value">{tooltipRecord.backend}</span>
			</div>
			<div class="pc-tooltip__row">
				<span class="pc-tooltip__label">Precision</span>
				<span class="pc-tooltip__value">{tooltipRecord.precision}</span>
			</div>
			<div class="pc-tooltip__row">
				<span class="pc-tooltip__label">Batch size</span>
				<span class="pc-tooltip__value">{tooltipRecord.batch_size}</span>
			</div>
			<div class="pc-tooltip__row">
				<span class="pc-tooltip__label">Attention</span>
				<span class="pc-tooltip__value">{tooltipRecord.attn_implementation}</span>
			</div>
			<div class="pc-tooltip__row pc-tooltip__row--energy">
				<span class="pc-tooltip__label">Energy/token</span>
				<span class="pc-tooltip__value pc-tooltip__value--energy">
					{tooltipRecord.avg_energy_per_token_j.toFixed(4)} J
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.pc-container {
		position: relative;
		width: 100%;
	}

	.pc-svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.pc-tooltip {
		position: absolute;
		pointer-events: none;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 6px);
		padding: var(--space-3) var(--space-4);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		min-width: 200px;
		z-index: 10;
	}

	.pc-tooltip__row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-1) 0;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.pc-tooltip__row--header {
		padding-bottom: var(--space-2);
		margin-bottom: var(--space-1);
		border-bottom: 1px solid var(--color-border);
		font-size: var(--text-sm);
	}

	.pc-tooltip__row--energy {
		padding-top: var(--space-2);
		margin-top: var(--space-1);
		border-top: 1px solid var(--color-border);
	}

	.pc-tooltip__label {
		font-weight: var(--weight-medium, 500);
	}

	.pc-tooltip__value {
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}

	.pc-tooltip__value--energy {
		color: var(--color-primary);
		font-weight: var(--weight-bold, 700);
	}
</style>
