<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import * as d3 from 'd3';
	import type { ParallelRecord } from '$lib/data/types.js';
	import { getDimensionLabel, formatDimensionValue } from '$lib/data/dimensions.js';

	interface Props {
		data: ParallelRecord[];
		onBrush: (_ranges: { energyRange?: [number, number] | null }) => void;
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

	// Discover axes dynamically from data dimensions + energy metric
	const axisKeys = $derived(() => {
		if (data.length === 0) return ['avg_energy_per_token_j'];
		const dimKeys = Object.keys(data[0].dimensions);
		return [...dimKeys, 'avg_energy_per_token_j'];
	});

	let axisOrder = $state<string[]>([]);

	// Reset axis order when data changes
	$effect(() => {
		const keys = axisKeys();
		axisOrder = keys;
	});

	function getAxisLabel(key: string): string {
		if (key === 'avg_energy_per_token_j') return 'Energy (J/tok)';
		return getDimensionLabel(key);
	}

	function getRecordValue(record: ParallelRecord, key: string): number | string {
		if (key === 'avg_energy_per_token_j') return record.avg_energy_per_token_j;
		const val = record.dimensions[key];
		if (val === undefined) return '';
		return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
	}

	function isNumericAxis(key: string, records: ParallelRecord[]): boolean {
		if (key === 'avg_energy_per_token_j') return true;
		return records.every((r) => typeof r.dimensions[key] === 'number');
	}

	// Scales: categorical axes use scalePoint, numeric use scaleLinear
	function buildScale(key: string, records: ParallelRecord[], h: number) {
		if (isNumericAxis(key, records)) {
			const vals = records.map((r) => getRecordValue(r, key) as number);
			const [lo, hi] = d3.extent(vals) as [number, number];
			return d3.scaleLinear().domain([lo, hi]).range([h, 0]).nice();
		} else {
			const vals = [...new Set(records.map((r) => String(getRecordValue(r, key))))].sort();
			return d3.scalePoint().domain(vals).range([h, 0]).padding(0.2);
		}
	}

	// Colour scale: energy-based RdBu (low=blue, high=red)
	function buildColorScale(records: ParallelRecord[]) {
		const vals = records.map((r) => r.avg_energy_per_token_j);
		const [lo, hi] = d3.extent(vals) as [number, number];
		return d3.scaleSequential(d3.interpolateRdBu).domain([hi, lo]);
	}

	function getY(
		key: string,
		record: ParallelRecord,
		scale: d3.ScaleLinear<number, number> | d3.ScalePoint<string>,
		records: ParallelRecord[]
	): number {
		if (isNumericAxis(key, records)) {
			return (scale as d3.ScaleLinear<number, number>)(getRecordValue(record, key) as number) ?? 0;
		} else {
			return (scale as d3.ScalePoint<string>)(String(getRecordValue(record, key))) ?? 0;
		}
	}

	function buildPath(
		record: ParallelRecord,
		axes: string[],
		xScale: d3.ScalePoint<string>,
		scales: Map<string, d3.ScaleLinear<number, number> | d3.ScalePoint<string>>,
		records: ParallelRecord[]
	): string {
		const points = axes.map((key) => {
			const x = xScale(key) ?? 0;
			const scale = scales.get(key)!;
			const y = getY(key, record, scale, records);
			return [x, y] as [number, number];
		});
		return d3.line()(points) ?? '';
	}

	// D3 infrastructure
	let brushSelections = new SvelteMap<string, [number, number] | null>();

	onMount(() => {
		if (!svgEl || !containerEl) return;

		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				width = entry.contentRect.width || 800;
			}
		});
		ro.observe(containerEl);

		setupSVG();

		return () => {
			ro.disconnect();
		};
	});

	let svgInitialised = false;

	function setupSVG() {
		if (!svgEl) return;

		const svg = d3.select(svgEl);
		svg.selectAll('*').remove();
		svgInitialised = false;

		const g = svg
			.append('g')
			.attr('class', 'main-g')
			.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

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

		const xScale = d3
			.scalePoint<string>()
			.domain(axisOrder)
			.range([0, innerWidth])
			.padding(0);

		const scales = new SvelteMap<string, d3.ScaleLinear<number, number> | d3.ScalePoint<string>>();
		for (const key of axisOrder) {
			scales.set(key, buildScale(key, data, innerHeight));
		}

		const colorScale = buildColorScale(data);

		// ── Lines ────────────────────────────────────────────────────────────
		const linesG = g.select<SVGGElement>('.lines-g');
		const paths = linesG
			.selectAll<SVGPathElement, ParallelRecord>('path.pc-line')
			.data(data, (d) => d.experiment_id);

		paths.join(
			(enter) =>
				enter
					.append('path')
					.attr('class', 'pc-line')
					.attr('fill', 'none')
					.attr('stroke-width', 1.5)
					.attr('stroke-opacity', 0.4)
					.attr('stroke', (d) => colorScale(d.avg_energy_per_token_j))
					.attr('d', (d) => buildPath(d, axisOrder, xScale, scales, data))
					.on('mouseover', function (event: MouseEvent, d: ParallelRecord) {
						linesG
							.selectAll<SVGPathElement, ParallelRecord>('path.pc-line')
							.attr('stroke-opacity', 0.1)
							.attr('stroke-width', 1.5);
						d3.select(this).attr('stroke-opacity', 1.0).attr('stroke-width', 2.5).raise();

						tooltipRecord = d;
						tooltipVisible = true;
						updateTooltipPosition(event);
					})
					.on('mousemove', function (event: MouseEvent) {
						updateTooltipPosition(event);
					})
					.on('mouseout', function () {
						linesG
							.selectAll<SVGPathElement, ParallelRecord>('path.pc-line')
							.attr('stroke-opacity', 0.4)
							.attr('stroke-width', 1.5);
						tooltipVisible = false;
						tooltipRecord = null;
					}),
			(update) =>
				update
					.attr('stroke', (d) => colorScale(d.avg_energy_per_token_j))
					.attr('d', (d) => buildPath(d, axisOrder, xScale, scales, data)),
			(exit) => exit.remove()
		);

		// ── Axes ─────────────────────────────────────────────────────────────
		const axesG = g.select<SVGGElement>('.axes-g');
		const axisGroups = axesG
			.selectAll<SVGGElement, string>('.axis-group')
			.data(axisOrder, (d) => d);

		const axisGroupsEnter = axisGroups
			.enter()
			.append('g')
			.attr('class', (d) => `axis-group axis-${d}`)
			.attr('transform', (d) => `translate(${xScale(d) ?? 0},0)`);

		const allAxisGroups = axisGroupsEnter.merge(
			axisGroups as d3.Selection<SVGGElement, string, SVGGElement, unknown>
		);

		allAxisGroups.attr('transform', (d) => `translate(${xScale(d) ?? 0},0)`);
		axisGroups.exit().remove();

		allAxisGroups.each(function (key) {
			const ag = d3.select<SVGGElement, string>(this);
			ag.selectAll('*').remove();

			const scale = scales.get(key)!;

			ag.append('line')
				.attr('class', 'axis-line')
				.attr('y1', 0)
				.attr('y2', innerHeight)
				.attr('stroke', 'var(--color-text-muted)')
				.attr('stroke-width', 1);

			if (isNumericAxis(key, data)) {
				const linScale = scale as d3.ScaleLinear<number, number>;
				const ticks = linScale.ticks(5);
				ticks.forEach((t) => {
					const y = linScale(t);
					ag.append('line')
						.attr('x1', -4)
						.attr('x2', 4)
						.attr('y1', y)
						.attr('y2', y)
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
						.attr('x1', -4)
						.attr('x2', 4)
						.attr('y1', y)
						.attr('y2', y)
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
			const label = ag
				.append('text')
				.attr('class', 'axis-label')
				.attr('y', -14)
				.attr('text-anchor', 'middle')
				.attr('font-family', 'var(--font-body)')
				.attr('font-size', 'var(--text-sm)')
				.attr('font-weight', 'var(--weight-bold)')
				.attr('fill', 'var(--color-text)')
				.attr('cursor', 'grab')
				.text(getAxisLabel(key));

			// Drag-reorder on label
			let dragStartX = 0;
			let dragStartOrder: string[] = [];

			const drag = d3
				.drag<SVGTextElement, string>()
				.on('start', function (_event) {
					dragStartX = xScale(key) ?? 0;
					dragStartOrder = [...axisOrder];
					d3.select(this).attr('cursor', 'grabbing');
				})
				.on('drag', function (event) {
					const currentX = dragStartX + event.x - (xScale(key) ?? 0) + event.x;
					ag.attr('transform', `translate(${dragStartX + event.x},0)`);

					const newOrder = [...dragStartOrder];
					const draggedIdx = newOrder.indexOf(key);
					const targetX = dragStartX + event.x;

					let insertIdx = draggedIdx;
					for (let i = 0; i < newOrder.length; i++) {
						if (i === draggedIdx) continue;
						const otherX = xScale(newOrder[i]) ?? 0;
						if (i < draggedIdx && targetX < otherX + xScale.step() / 2) {
							insertIdx = i;
							break;
						} else if (i > draggedIdx && targetX > otherX - xScale.step() / 2) {
							insertIdx = i;
						}
					}

					if (insertIdx !== draggedIdx) {
						newOrder.splice(draggedIdx, 1);
						newOrder.splice(insertIdx, 0, key);
					}
					void currentX;
				})
				.on('end', function (event) {
					d3.select(this).attr('cursor', 'grab');

					const targetX = dragStartX + event.x;
					const newOrder = [...dragStartOrder];
					const draggedIdx = newOrder.indexOf(key);

					const others = newOrder
						.filter((k) => k !== key)
						.map((k) => ({ key: k, x: xScale(k) ?? 0 }));

					let insertIdx = 0;
					for (let i = 0; i < others.length; i++) {
						if (targetX > others[i].x) insertIdx = i + 1;
					}

					newOrder.splice(draggedIdx, 1);
					newOrder.splice(insertIdx, 0, key);
					axisOrder = newOrder;

					setupSVG();
				});

			label.call(drag);

			// ── Brush on numeric axes ─────────────────────────────────────────
			if (isNumericAxis(key, data)) {
				const linScale = scale as d3.ScaleLinear<number, number>;

				const brush = d3
					.brushY()
					.extent([
						[-8, 0],
						[8, innerHeight]
					])
					.on('brush end', function (event) {
						if (!event.selection) {
							brushSelections.set(key, null);
						} else {
							const [py0, py1] = event.selection as [number, number];
							const lo = linScale.invert(py1);
							const hi = linScale.invert(py0);
							brushSelections.set(key, [lo, hi]);
						}

						const energySel = brushSelections.get('avg_energy_per_token_j') ?? null;
						onBrush({
							energyRange: energySel
						});
					});

				(
					ag.append('g').attr('class', 'brush') as unknown as d3.Selection<
						SVGGElement,
						unknown,
						null,
						undefined
					>
				).call(brush);

				ag.select<SVGGElement>('.brush')
					.select('.selection')
					.attr('fill', 'var(--color-primary)')
					.attr('fill-opacity', 0.1)
					.attr('stroke', 'var(--color-primary)')
					.attr('stroke-opacity', 0.5);
			}
		});
	}

	// Update lines when data prop changes
	$effect(() => {
		const _d = data;
		if (svgInitialised && svgEl) {
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

		if (x + 220 > rect.width) x = event.clientX - rect.left - 230;
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
		role="img"
		aria-label="Parallel coordinates chart: vertical axes represent configuration dimensions and energy per token. Each configuration is drawn as a polyline crossing all axes. Lines are coloured blue-to-red by energy per token. Brushing numeric axes filters the visible configurations."
	></svg>

	{#if tooltipVisible && tooltipRecord}
		<div class="pc-tooltip" style="left: {tooltipX}px; top: {tooltipY}px;" aria-live="polite">
			{#each Object.entries(tooltipRecord.dimensions) as [key, value], i (key)}
				<div
					class="pc-tooltip__row"
					class:pc-tooltip__row--header={i === 0}
				>
					<span class="pc-tooltip__label">{getDimensionLabel(key)}</span>
					<span class="pc-tooltip__value">{formatDimensionValue(key, value)}</span>
				</div>
			{/each}
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
