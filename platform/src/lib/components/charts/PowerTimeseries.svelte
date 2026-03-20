<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { browser } from '$app/environment';
	import TimeseriesControls from './TimeseriesControls.svelte';
	import MethodologyLink from './MethodologyLink.svelte';
	import { synthesisePowerCurve } from '$lib/data/transforms/timeseriesData.js';
	import { smartphoneCharges } from '$lib/data/transforms/equivalences.js';
	import type { ExperimentResult, PowerPoint } from '$lib/data/types.js';

	interface Props {
		allResults: ExperimentResult[];
		scrollProgress: number;
	}

	const { allResults, scrollProgress }: Props = $props();

	// ── Config list from unique experiment configs ──────────────────────────
	const configs = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const list: { label: string; id: string; result: ExperimentResult }[] = [];

		for (const r of allResults) {
			const c = r.effective_config;
			const id = `${c.precision}__${c.batch_size}__${c.backend}__${c.attn_implementation}`;
			if (!seen.has(id)) {
				seen.add(id);
				const label = `${c.precision}, batch ${c.batch_size}, ${c.backend}, ${c.attn_implementation}`;
				list.push({ label, id, result: r });
			}
		}

		// Sort by energy descending (worst first) so worst=index 0, best=last
		list.sort((a, b) => b.result.avg_energy_per_token_j - a.result.avg_energy_per_token_j);
		return list;
	});

	const configOptions = $derived(configs.map(({ label, id }) => ({ label, id })));

	// ── Selected configs (default: worst vs best) ───────────────────────────
	let leftConfigId = $state('');
	let rightConfigId = $state('');

	// Initialise from configs once derived
	$effect(() => {
		if (configs.length > 0 && !leftConfigId) {
			leftConfigId = configs[0].id; // worst
		}
		if (configs.length > 1 && !rightConfigId) {
			rightConfigId = configs[configs.length - 1].id; // best
		}
	});

	// ── Playback state ──────────────────────────────────────────────────────
	let showControls = $state(false);
	let playing = $state(false);
	let manualProgress = $state<number | null>(null);

	// Effective progress for clip-path reveal
	const effectiveProgress = $derived(manualProgress !== null ? manualProgress : scrollProgress);

	// ── SVG dimensions ──────────────────────────────────────────────────────
	const MARGIN = { top: 24, right: 16, bottom: 40, left: 52 };
	const SVG_HEIGHT = 260;
	let svgWidth = $state(300);

	let leftPanel: HTMLDivElement;

	$effect(() => {
		if (!browser || !leftPanel) return;
		const ro = new ResizeObserver(([entry]) => {
			svgWidth = Math.max(200, entry.contentRect.width);
		});
		ro.observe(leftPanel);
		return () => ro.disconnect();
	});

	const innerWidth = $derived(svgWidth - MARGIN.left - MARGIN.right);
	const innerHeight = $derived(SVG_HEIGHT - MARGIN.top - MARGIN.bottom);

	// ── Power curves derived from selected configs ──────────────────────────
	const NORMALISED_TIME_SEC = 60;

	function getResult(id: string): ExperimentResult | null {
		return configs.find((c) => c.id === id)?.result ?? null;
	}

	function buildCurve(result: ExperimentResult | null): PowerPoint[] {
		if (!result) return [];
		return synthesisePowerCurve(
			result.total_energy_j,
			NORMALISED_TIME_SEC, // normalise both curves to same time axis
			result.baseline_power_w ?? 60
		);
	}

	const leftResult = $derived(getResult(leftConfigId));
	const rightResult = $derived(getResult(rightConfigId));
	const leftCurve = $derived(buildCurve(leftResult));
	const rightCurve = $derived(buildCurve(rightResult));

	// ── D3 scales and paths ─────────────────────────────────────────────────
	// Compute max W across both curves for a shared Y scale
	const maxW = $derived.by(() => {
		const all = [...leftCurve, ...rightCurve];
		return all.length > 0 ? Math.max(...all.map((p) => p.w)) * 1.1 : 500;
	});

	function buildPath(
		curve: PowerPoint[],
		iWidth: number,
		iHeight: number,
		isArea: boolean
	): string {
		if (curve.length === 0) return '';
		const lastT = curve[curve.length - 1].t;
		const xScale = (t: number) => (t / lastT) * iWidth;
		const yScale = (w: number) => iHeight - (w / maxW) * iHeight;

		const pts = curve.map((p) => `${xScale(p.t).toFixed(1)},${yScale(p.w).toFixed(1)}`);

		if (isArea) {
			return `M${pts[0]} L${pts.join(' L')} L${xScale(lastT).toFixed(1)},${iHeight} L0,${iHeight} Z`;
		}
		return `M${pts[0]} L${pts.join(' L')}`;
	}

	const leftLinePath = $derived(buildPath(leftCurve, innerWidth, innerHeight, false));
	const leftAreaPath = $derived(buildPath(leftCurve, innerWidth, innerHeight, true));
	const rightLinePath = $derived(buildPath(rightCurve, innerWidth, innerHeight, false));
	const rightAreaPath = $derived(buildPath(rightCurve, innerWidth, innerHeight, true));

	// ── Y-axis ticks ────────────────────────────────────────────────────────
	const yTicks = $derived.by(() => {
		const count = 4;
		const ticks = [];
		for (let i = 0; i <= count; i++) {
			const w = (maxW * i) / count;
			const y = innerHeight - (i / count) * innerHeight;
			ticks.push({ w: Math.round(w), y });
		}
		return ticks;
	});

	// ── X-axis ticks (normalised time 0-60s) ────────────────────────────────
	const xTicks = [0, 15, 30, 45, 60].map((t) => ({
		t,
		x: (t / NORMALISED_TIME_SEC) * innerWidth
	}));

	// ── Clip rect width driven by progress ─────────────────────────────────
	const clipWidth = $derived(Math.max(0, effectiveProgress * innerWidth));

	// ── Running energy counter ───────────────────────────────────────────────
	function computeRevealedEnergy(curve: PowerPoint[], progress: number): number {
		if (curve.length < 2) return 0;
		const revealTime = progress * NORMALISED_TIME_SEC;
		let energy = 0;
		for (let i = 1; i < curve.length; i++) {
			if (curve[i].t > revealTime) break;
			const dt = curve[i].t - curve[i - 1].t;
			const avgW = (curve[i].w + curve[i - 1].w) / 2;
			energy += avgW * dt;
		}
		return energy;
	}

	const leftEnergy = $derived(computeRevealedEnergy(leftCurve, effectiveProgress));
	const rightEnergy = $derived(computeRevealedEnergy(rightCurve, effectiveProgress));

	// Smartphone equivalence at deployment scale (static per config, not scroll-driven)
	const leftCharges = $derived(
		leftResult ? smartphoneCharges(leftResult.avg_energy_per_token_j).toLocaleString() : '—'
	);
	const rightCharges = $derived(
		rightResult ? smartphoneCharges(rightResult.avg_energy_per_token_j).toLocaleString() : '—'
	);

	function formatEnergy(j: number): string {
		if (j >= 1000) return `${(j / 1000).toFixed(2)} kJ`;
		return `${j.toFixed(0)} J`;
	}

	// ── Config summary lines for panel titles ──────────────────────────────
	function configSummary(result: ExperimentResult | null): string {
		if (!result) return '';
		const c = result.effective_config;
		return `${c.precision}, batch ${c.batch_size}`;
	}

	function panelTitle(id: string): string {
		const idx = configs.findIndex((c) => c.id === id);
		const total = configs.length;
		if (total === 0) return 'Selected';
		if (idx === 0) return 'Worst case';
		if (idx === total - 1) return 'Best case';
		return 'Configuration';
	}

	// ── GSAP / manual playback ───────────────────────────────────────────────
	let animationFrame: number | null = null;
	let playStartTime: number | null = null;
	let playStartProgress = 0;
	const PLAY_DURATION_MS = 3000;

	function doPlay() {
		playing = true;
		// If at end, restart from 0
		if ((manualProgress ?? effectiveProgress) >= 0.99) {
			manualProgress = 0;
		}
		playStartProgress = manualProgress ?? effectiveProgress;
		playStartTime = performance.now();
		scheduleFrame();
	}

	function scheduleFrame() {
		animationFrame = requestAnimationFrame(tick);
	}

	function tick(now: number) {
		if (!playStartTime) return;
		const elapsed = now - playStartTime;
		const remaining = 1 - playStartProgress;
		const prog = playStartProgress + (elapsed / PLAY_DURATION_MS) * remaining;
		manualProgress = Math.min(1, prog);
		if (manualProgress < 1) {
			scheduleFrame();
		} else {
			playing = false;
			animationFrame = null;
		}
	}

	function doPause() {
		playing = false;
		if (animationFrame !== null) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	}

	function doSeek(p: number) {
		doPause();
		manualProgress = p;
	}

	// Show controls once scroll-driven animation completes
	$effect(() => {
		if (scrollProgress >= 0.99 && !showControls) {
			showControls = true;
		}
	});

	// Cleanup on unmount
	onMount(() => {
		return () => {
			if (animationFrame !== null) cancelAnimationFrame(animationFrame);
		};
	});
</script>

<div class="power-timeseries">
	<!-- Side-by-side panels -->
	<div class="panels">
		<!-- Left panel -->
		<div class="panel" bind:this={leftPanel}>
			<h3 class="panel-title panel-title--wasteful">{panelTitle(leftConfigId)}</h3>
			<p class="panel-config">{configSummary(leftResult)}</p>

			<svg
				class="panel-svg"
				width={svgWidth}
				height={SVG_HEIGHT}
				role="img"
				aria-label="Power timeseries: {panelTitle(leftConfigId)}"
			>
				<defs>
					<clipPath id="left-clip">
						<rect x="0" y="0" width={clipWidth} height={innerHeight + MARGIN.top} />
					</clipPath>
				</defs>

				<!-- Axes -->
				<g transform="translate({MARGIN.left},{MARGIN.top})">
					<!-- Y-axis gridlines and labels -->
					{#each yTicks as tick (tick.w)}
						<g>
							<line
								x1="0"
								y1={tick.y}
								x2={innerWidth}
								y2={tick.y}
								stroke="var(--color-border)"
								stroke-dasharray="3,3"
							/>
							<text
								x="-8"
								y={tick.y + 4}
								text-anchor="end"
								font-size="11"
								fill="var(--color-text-muted)">{tick.w}</text
							>
						</g>
					{/each}

					<!-- X-axis ticks -->
					{#each xTicks as tick (tick.t)}
						<g>
							<line
								x1={tick.x}
								y1={innerHeight}
								x2={tick.x}
								y2={innerHeight + 5}
								stroke="var(--color-border)"
							/>
							<text
								x={tick.x}
								y={innerHeight + 18}
								text-anchor="middle"
								font-size="11"
								fill="var(--color-text-muted)">{tick.t}s</text
							>
						</g>
					{/each}

					<!-- Y-axis label -->
					<text
						transform="rotate(-90)"
						x={-innerHeight / 2}
						y="-38"
						text-anchor="middle"
						font-size="11"
						fill="var(--color-text-muted)">GPU power (W)</text
					>

					<!-- X-axis label -->
					<text
						x={innerWidth / 2}
						y={innerHeight + 36}
						text-anchor="middle"
						font-size="11"
						fill="var(--color-text-muted)">Normalised inference time</text
					>

					<!-- Area (clipped) -->
					<path
						d={leftAreaPath}
						fill="var(--color-energy-wasteful)"
						fill-opacity="0.2"
						clip-path="url(#left-clip)"
					/>

					<!-- Line (clipped) -->
					<path
						d={leftLinePath}
						fill="none"
						stroke="var(--color-energy-wasteful)"
						stroke-width="2"
						stroke-linejoin="round"
						clip-path="url(#left-clip)"
					/>
				</g>
			</svg>

			<div class="energy-counter energy-counter--wasteful">
				<span class="energy-label">Energy drawn so far</span>
				<span class="energy-value">{formatEnergy(leftEnergy)}</span>
				<span class="energy-equivalence"
					>= {leftCharges} smartphone charges / 10M queries per month</span
				>
			</div>
		</div>

		<!-- Right panel -->
		<div class="panel">
			<h3 class="panel-title panel-title--efficient">{panelTitle(rightConfigId)}</h3>
			<p class="panel-config">{configSummary(rightResult)}</p>

			<svg
				class="panel-svg"
				width={svgWidth}
				height={SVG_HEIGHT}
				role="img"
				aria-label="Power timeseries: {panelTitle(rightConfigId)}"
			>
				<defs>
					<clipPath id="right-clip">
						<rect x="0" y="0" width={clipWidth} height={innerHeight + MARGIN.top} />
					</clipPath>
				</defs>

				<!-- Axes -->
				<g transform="translate({MARGIN.left},{MARGIN.top})">
					<!-- Y-axis gridlines and labels -->
					{#each yTicks as tick (tick.w)}
						<g>
							<line
								x1="0"
								y1={tick.y}
								x2={innerWidth}
								y2={tick.y}
								stroke="var(--color-border)"
								stroke-dasharray="3,3"
							/>
							<text
								x="-8"
								y={tick.y + 4}
								text-anchor="end"
								font-size="11"
								fill="var(--color-text-muted)">{tick.w}</text
							>
						</g>
					{/each}

					<!-- X-axis ticks -->
					{#each xTicks as tick (tick.t)}
						<g>
							<line
								x1={tick.x}
								y1={innerHeight}
								x2={tick.x}
								y2={innerHeight + 5}
								stroke="var(--color-border)"
							/>
							<text
								x={tick.x}
								y={innerHeight + 18}
								text-anchor="middle"
								font-size="11"
								fill="var(--color-text-muted)">{tick.t}s</text
							>
						</g>
					{/each}

					<!-- Y-axis label -->
					<text
						transform="rotate(-90)"
						x={-innerHeight / 2}
						y="-38"
						text-anchor="middle"
						font-size="11"
						fill="var(--color-text-muted)">GPU power (W)</text
					>

					<!-- X-axis label -->
					<text
						x={innerWidth / 2}
						y={innerHeight + 36}
						text-anchor="middle"
						font-size="11"
						fill="var(--color-text-muted)">Normalised inference time</text
					>

					<!-- Area (clipped) -->
					<path
						d={rightAreaPath}
						fill="var(--color-energy-efficient)"
						fill-opacity="0.2"
						clip-path="url(#right-clip)"
					/>

					<!-- Line (clipped) -->
					<path
						d={rightLinePath}
						fill="none"
						stroke="var(--color-energy-efficient)"
						stroke-width="2"
						stroke-linejoin="round"
						clip-path="url(#right-clip)"
					/>
				</g>
			</svg>

			<div class="energy-counter energy-counter--efficient">
				<span class="energy-label">Energy drawn so far</span>
				<span class="energy-value">{formatEnergy(rightEnergy)}</span>
				<span class="energy-equivalence"
					>= {rightCharges} smartphone charges / 10M queries per month</span
				>
			</div>
		</div>
	</div>

	<!-- Normalised time note -->
	<p class="time-note">
		Both curves normalised to 60 s. Real inference durations vary by configuration — see methodology
		for details.
	</p>

	<!-- Replay controls (appear after scroll-driven animation completes) -->
	<TimeseriesControls
		{playing}
		progress={effectiveProgress}
		visible={showControls}
		configs={configOptions}
		{leftConfigId}
		{rightConfigId}
		onPlay={doPlay}
		onPause={doPause}
		onSeek={doSeek}
		onLeftChange={(id) => {
			leftConfigId = id;
		}}
		onRightChange={(id) => {
			rightConfigId = id;
		}}
	/>

	<MethodologyLink />
</div>

<style>
	.power-timeseries {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
	}

	.panels {
		display: flex;
		gap: var(--space-6);
		width: 100%;
	}

	.panel {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.panel-title {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		margin: 0;
		line-height: var(--leading-tight);
	}

	.panel-title--wasteful {
		color: var(--color-energy-wasteful);
	}

	.panel-title--efficient {
		color: var(--color-energy-efficient);
	}

	.panel-config {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin: 0;
	}

	.panel-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.energy-counter {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.energy-label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.energy-value {
		font-family: var(--font-heading);
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: 1;
	}

	.energy-counter--wasteful .energy-value {
		color: var(--color-energy-wasteful);
	}

	.energy-counter--efficient .energy-value {
		color: var(--color-energy-efficient);
	}

	.energy-equivalence {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin-top: var(--space-1);
	}

	.time-note {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin: 0;
		font-style: italic;
	}

	/* Mobile: stack panels vertically */
	@media (max-width: 640px) {
		.panels {
			flex-direction: column;
		}
	}

	/* Reduced motion: disable auto-play animation */
	@media (prefers-reduced-motion: reduce) {
		.panel-svg path {
			transition: none;
		}
	}
</style>
