<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ScrollNarrative from '$lib/components/scroll/ScrollNarrative.svelte';
	import NarrativeSection from '$lib/components/scroll/NarrativeSection.svelte';
	import ConfigHeatmap from '$lib/components/charts/ConfigHeatmap.svelte';
	import ConfigHeatmapInteractive from '$lib/components/charts/ConfigHeatmapInteractive.svelte';
	import PowerTimeseries from '$lib/components/charts/PowerTimeseries.svelte';
	import MethodologyLink from '$lib/components/charts/MethodologyLink.svelte';
	import ExpandableDetail from '$lib/components/ExpandableDetail.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// Beat 1: animated counter state
	let displayRatio = $state(1);
	let hookRevealed = $state(false);
	let secondaryVisible = $state(false);
	let tertiaryVisible = $state(false);
	let equivalenceVisible = $state(false);

	// Beat 2: heatmap reveal progress (0-1)
	let heatmapReveal = $state(0);

	// Beat 4: timeseries scroll progress (0-1)
	let timeseriesProgress = $state(0);

	// Beat 1 counter animation: count from 1 to energyRatio over ~1.5s
	function runCounterAnimation() {
		const target = data.energyRatio;
		const duration = 1500;
		const start = performance.now();

		function tick(now: number) {
			const elapsed = now - start;
			const t = Math.min(elapsed / duration, 1);
			// Ease out cubic
			const eased = 1 - Math.pow(1 - t, 3);
			displayRatio = Math.max(1, Math.round(1 + (target - 1) * eased));

			if (t < 1) {
				requestAnimationFrame(tick);
			} else {
				displayRatio = target;
			}
		}

		requestAnimationFrame(tick);
	}

	// Beat 2: track scroll progress of the beat-2 section using scroll events
	let beat2El: HTMLElement | null = null;

	function trackBeat2Progress() {
		if (!beat2El || !browser) return;

		const rect = beat2El.getBoundingClientRect();
		const windowH = window.innerHeight;

		// Progress: 0 when section top enters viewport, 1 when section bottom exits
		const start = rect.top;
		const end = rect.bottom - windowH;

		if (end <= 0 && start <= 0) {
			// Section fully scrolled past
			heatmapReveal = 1;
		} else if (start > windowH) {
			// Section not yet reached
			heatmapReveal = 0;
		} else {
			// In progress: map from section top reaching top of viewport to section bottom leaving viewport
			const totalScroll = rect.height - windowH;
			if (totalScroll <= 0) {
				// Section shorter than viewport: reveal fully when it enters
				heatmapReveal = start < windowH * 0.5 ? 1 : 0;
			} else {
				const progress = Math.max(0, Math.min(1, (-start) / totalScroll));
				heatmapReveal = progress;
			}
		}
	}

	// Beat 4: track timeseries scroll progress
	let beat4El: HTMLElement | null = null;

	function trackBeat4Progress() {
		if (!beat4El || !browser) return;

		const rect = beat4El.getBoundingClientRect();
		const windowH = window.innerHeight;

		if (rect.bottom <= 0 && rect.top <= 0) {
			timeseriesProgress = 1;
		} else if (rect.top > windowH) {
			timeseriesProgress = 0;
		} else {
			const totalScroll = rect.height - windowH;
			if (totalScroll <= 0) {
				timeseriesProgress = rect.top < windowH * 0.5 ? 1 : 0;
			} else {
				timeseriesProgress = Math.max(0, Math.min(1, (-rect.top) / totalScroll));
			}
		}
	}

	onMount(() => {
		if (!browser) return;

		// Trigger Beat 1 animation after a short delay
		const hookTimer = setTimeout(() => {
			hookRevealed = true;
			runCounterAnimation();

			setTimeout(() => { secondaryVisible = true; }, 400);
			setTimeout(() => { tertiaryVisible = true; }, 800);
			setTimeout(() => { equivalenceVisible = true; }, 1200);
		}, 300);

		// Set up scroll tracking for Beat 2 and Beat 4
		const handleScroll = () => {
			trackBeat2Progress();
			trackBeat4Progress();
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		// Initial checks
		trackBeat2Progress();
		trackBeat4Progress();

		return () => {
			clearTimeout(hookTimer);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	// Responsive heatmap width: track container width
	let heatmapContainerEl: HTMLElement | null = null;
	let heatmapWidth = $state(560);
	let heatmapHeight = $state(400);

	onMount(() => {
		if (!browser || !heatmapContainerEl) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const w = entry.contentRect.width;
				heatmapWidth = Math.max(280, Math.min(w, 700));
				heatmapHeight = Math.round(heatmapWidth * 0.7);
			}
		});

		ro.observe(heatmapContainerEl);
		return () => ro.disconnect();
	});

	// Beat 5: deployment bar chart derived values
	const deploymentMax = $derived(
		Math.max(...data.deploymentData.map((d) => d.energyPerToken))
	);
</script>

<svelte:head>
	<title>LLM Energy Commons — Same model. Same GPU. 8x energy difference.</title>
	<meta
		name="description"
		content="Same model, same GPU — up to 8x energy difference from configuration choices alone. Evidence-based guidance for AI energy policy."
	/>
</svelte:head>

<ScrollNarrative>
	<!-- ========================================================
	     Beat 1: Hook
	     Full-viewport dark section, animated 8x counter
	     ======================================================== -->
	<NarrativeSection id="beat-1" fullViewport>
		<div class="beat-1">
			<div class="beat-1__counter" class:revealed={hookRevealed}>
				<span class="counter-number">{displayRatio}<span class="counter-x">x</span></span>
			</div>
			<p class="beat-1__secondary" class:visible={secondaryVisible}>
				Same model. Same GPU.
			</p>
			<p class="beat-1__tertiary" class:visible={tertiaryVisible}>
				Different configuration.
			</p>
			<p class="beat-1__equivalence" class:visible={equivalenceVisible}>
				At scale: {data.worstCharges.toLocaleString()} vs {data.bestCharges.toLocaleString()} smartphone charges per month.
			</p>
			<nav class="beat-1__skip" class:visible={equivalenceVisible}>
				<a href="#beat-3">Skip to explorer &darr;</a>
			</nav>
		</div>
	</NarrativeSection>

	<!-- ========================================================
	     Beat 2: Reveal — progressive heatmap
	     ======================================================== -->
	<div bind:this={beat2El}>
		<NarrativeSection id="beat-2">
			{#snippet graphic()}
				<div class="beat-2__graphic" bind:this={heatmapContainerEl}>
					<ConfigHeatmap
						cells={data.heatmapCells}
						revealProgress={heatmapReveal}
						width={heatmapWidth}
						height={heatmapHeight}
					/>
					<div class="beat-2__methodology">
						<MethodologyLink />
					</div>
				</div>
			{/snippet}

			<div class="narrative-steps">
				<div class="step">
					<h2 class="step__heading">What's driving that {data.energyRatio}x?</h2>
					<p class="step__body">
						The chart shows energy per output token for every combination of numerical
						precision and batch size, using the PyTorch backend with SDPA attention.
						Red is wasteful. Blue is efficient.
					</p>
				</div>

				<div class="step">
					<h2 class="step__heading">Precision and batch size dominate</h2>
					<p class="step__body">
						fp32 at batch&nbsp;1 (top-left, deep red) uses {data.energyRatio}x more energy per token
						than the best-case configuration. Switching to bf16 and increasing batch size
						transforms the same model into a dramatically more efficient system.
					</p>
				</div>

				<div class="step step--callout">
					<div class="equivalence-card">
						<p class="equivalence-card__label">At 10 million queries per month</p>
						<div class="equivalence-card__comparison">
							<div class="equivalence-card__item equivalence-card__item--bad">
								<span class="equivalence-card__value wasteful">{data.worstCharges.toLocaleString()}</span>
								<span class="equivalence-card__unit">smartphone charges</span>
								<span class="equivalence-card__config">fp32, batch&nbsp;1</span>
							</div>
							<div class="equivalence-card__vs">vs</div>
							<div class="equivalence-card__item equivalence-card__item--good">
								<span class="equivalence-card__value efficient">{data.bestCharges.toLocaleString()}</span>
								<span class="equivalence-card__unit">smartphone charges</span>
								<span class="equivalence-card__config">bf16, batch&nbsp;128</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</NarrativeSection>
	</div>

	<!-- ========================================================
	     Beat 3: Exploration — interactive heatmap
	     Two-part layout: short intro + full interactive section
	     ======================================================== -->
	<NarrativeSection id="beat-3">
		<div class="beat-3__intro">
			<h2 class="beat-3__heading">Now explore for yourself</h2>
			<p class="beat-3__body">
				Filter by inference backend (PyTorch, vLLM, TensorRT) and attention implementation.
				Click any cell to see the full configuration breakdown. The {data.energyRatio}x gap
				holds across every combination.
			</p>
		</div>
	</NarrativeSection>

	<!-- Unpinned full-height section: free interaction with heatmap -->
	<section id="beat-3-explorer" class="beat-3-explorer">
		<div class="beat-3-explorer__inner">
			<ConfigHeatmapInteractive allResults={data.allResults} />
		</div>
	</section>

	<!-- ========================================================
	     Beat 4: Depth — animated power timeseries
	     ======================================================== -->
	<div bind:this={beat4El}>
		<NarrativeSection id="beat-4">
			{#snippet graphic()}
				<div class="beat-4__graphic">
					<PowerTimeseries allResults={data.allResults} scrollProgress={timeseriesProgress} />
				</div>
			{/snippet}

			<div class="narrative-steps">
				<div class="step">
					<h2 class="step__heading">Watch inference happen</h2>
					<p class="step__body">
						GPU power draw traces the shape of inference — ramp up, plateau, wind down.
						The worst-case configuration sustains higher power throughout. Scroll to reveal both curves.
					</p>
				</div>

				<div class="step">
					<h2 class="step__heading">The difference is physical</h2>
					<p class="step__body">
						Every watt-second of difference is real energy drawn from the grid. The shaded
						area under each curve is the total energy consumed — watch the gap open.
					</p>
				</div>

				<div class="step step--callout">
					<div class="depth-callout">
						<p class="depth-callout__label">At the end of inference</p>
						<p class="depth-callout__body">
							The worst-case configuration has consumed {data.energyRatio}x more energy
							for the same number of tokens. Multiply by millions of daily queries —
							and the choice of <em>how</em> you deploy matters as much as <em>what</em> you deploy.
						</p>
					</div>
				</div>
			</div>
		</NarrativeSection>
	</div>

	<!-- ========================================================
	     Beat 5: Action — three policy levers
	     ======================================================== -->
	<NarrativeSection id="beat-5">
		<div class="beat-5">
			<header class="beat-5__header">
				<h2 class="beat-5__title">Three levers for policy</h2>
				<p class="beat-5__intro">
					The {data.energyRatio}x efficiency gap can be closed today — no new technology required.
					Three policy levers operate at the points where decisions are actually made.
				</p>
			</header>

			<!-- Lever 1: Regulation -->
			<div class="lever">
				<div class="lever__header">
					<span class="lever__number">1</span>
					<div>
						<h3 class="lever__title">Regulation</h3>
						<p class="lever__action">Mandate efficiency benchmarking in AI procurement standards</p>
					</div>
				</div>

				<p class="lever__body">
					Regulatory frameworks currently specify model capability thresholds but ignore
					operational efficiency. A simple requirement to report energy per output token at
					defined hardware configurations would make the {data.globalRatio}x variation visible
					to procurement teams — before contracts are signed.
				</p>

				<!-- Min/max energy range indicator -->
				<div class="range-indicator">
					<div class="range-indicator__label">
						Energy per token across all configurations
					</div>
					<div class="range-indicator__bar-row">
						<span class="range-indicator__end range-indicator__end--efficient">
							{(data.minEnergyGlobal * 1000).toFixed(2)} mJ
						</span>
						<div class="range-indicator__bar">
							<div class="range-indicator__fill"></div>
						</div>
						<span class="range-indicator__end range-indicator__end--wasteful">
							{(data.maxEnergyGlobal * 1000).toFixed(2)} mJ
						</span>
					</div>
					<div class="range-indicator__sublabel">
						{data.globalRatio}x spread — fully addressable by configuration choice
					</div>
				</div>

				<ExpandableDetail title="Technical depth: what benchmarking requires">
					<p class="lever-note">
						Standardised efficiency benchmarking requires three components: a fixed hardware
						reference (e.g., an A100 80GB), a canonical inference workload (fixed prompt
						length, batch size, output tokens), and a reporting format compatible with
						existing procurement documentation. The llenergymeasure schema provides a
						machine-readable starting point.
					</p>
					<p class="lever-note">
						ISO/IEC and NIST AI Risk Management frameworks already include provisions for
						operational transparency — efficiency benchmarking can be added as a reporting
						requirement without new legislation in most jurisdictions.
					</p>
				</ExpandableDetail>
			</div>

			<!-- Lever 2: Deployment -->
			<div class="lever">
				<div class="lever__header">
					<span class="lever__number">2</span>
					<div>
						<h3 class="lever__title">Deployment</h3>
						<p class="lever__action">Use production-optimised inference backends by default</p>
					</div>
				</div>

				<p class="lever__body">
					Research teams default to PyTorch for reproducibility. Production systems often
					inherit those defaults. Switching to vLLM or TensorRT at the same precision
					reduces energy per token materially — with no change to model weights or hardware.
				</p>

				<!-- Backend comparison bar chart -->
				<div class="deployment-chart" aria-label="Energy per token by backend at bf16 precision">
					<p class="deployment-chart__label">Energy per token (bf16, SDPA, best batch)</p>
					{#each data.deploymentData as item (item.backend)}
						<div class="bar-row">
							<span class="bar-label">{item.label}</span>
							<div class="bar-track">
								<div
									class="bar-fill"
									class:bar-fill--worst={item.backend === 'pytorch'}
									class:bar-fill--best={item.backend === 'tensorrt'}
									style="width: {deploymentMax > 0 ? (item.energyPerToken / deploymentMax) * 100 : 0}%"
								></div>
							</div>
							<span class="bar-value">{(item.energyPerToken * 1000).toFixed(2)} mJ</span>
						</div>
					{/each}
				</div>

				<ExpandableDetail title="Technical depth: backend efficiency differences">
					<p class="lever-note">
						vLLM and TensorRT achieve efficiency gains through continuous batching,
						kernel fusion, and memory management optimisations absent in vanilla PyTorch.
						These gains compound: at higher batch sizes, TensorRT's fused attention
						kernels substantially reduce memory bandwidth pressure compared to eager
						or SDPA attention.
					</p>
					<p class="lever-note">
						Switching backends requires revalidating output quality at deployment — a one-time
						engineering investment that pays ongoing efficiency dividends.
					</p>
				</ExpandableDetail>
			</div>

			<!-- Lever 3: Procurement -->
			<div class="lever">
				<div class="lever__header">
					<span class="lever__number">3</span>
					<div>
						<h3 class="lever__title">Procurement</h3>
						<p class="lever__action">Include efficiency configuration requirements in AI service contracts</p>
					</div>
				</div>

				<p class="lever__body">
					AI service contracts specify SLA uptime, latency targets, and model version — but
					rarely operational efficiency. Adding a minimum energy-per-token threshold
					(verified at contract renewal) shifts the burden of configuration optimisation
					to the provider, where it belongs.
				</p>

				<!-- 8x cost framing -->
				<div class="procurement-callout">
					<div class="procurement-callout__ratio">
						<span class="procurement-callout__number wasteful">{data.energyRatio}x</span>
						<span class="procurement-callout__label">energy cost difference</span>
					</div>
					<p class="procurement-callout__body">
						Between worst and best configuration for the same model, on the same hardware.
						A contract that doesn't specify configuration effectively allows the provider
						to deliver the {data.energyRatio}x worse outcome at the same price.
					</p>
				</div>

				<ExpandableDetail title="Technical depth: contract specification language">
					<p class="lever-note">
						An efficiency clause might read: "The service shall operate at no greater than
						[X] mJ per output token at the contracted hardware tier, measured under the
						llenergymeasure benchmark protocol at 90th-percentile load." X can be derived
						from the best-known configuration for the contracted model.
					</p>
					<p class="lever-note">
						Measurement cost is low: llenergymeasure benchmarks run in under 30 minutes
						on standard ML infrastructure. The measurement overhead does not justify
						exclusion from contract terms.
					</p>
				</ExpandableDetail>
			</div>

			<div class="beat-5__footer">
				<MethodologyLink />
			</div>
		</div>
	</NarrativeSection>
</ScrollNarrative>

<style>
	/* ── Beat 1: Hook ── */
	.beat-1 {
		min-height: 100vh;
		background-color: #0f0f0f;
		color: #ffffff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-8) var(--space-6);
		width: 100vw;
		margin-left: calc(-50vw + 50%);
	}

	.beat-1__counter {
		opacity: 0;
		transform: scale(0.85);
		transition:
			opacity 0.6s ease,
			transform 0.6s ease;
		margin-bottom: var(--space-8);
	}

	.beat-1__counter.revealed {
		opacity: 1;
		transform: scale(1);
	}

	.counter-number {
		font-family: var(--font-heading);
		font-size: clamp(6rem, 20vw, 14rem);
		font-weight: var(--weight-bold);
		line-height: 1;
		color: #ffffff;
	}

	.counter-x {
		font-size: 0.6em;
		color: var(--color-energy-wasteful);
	}

	.beat-1__secondary,
	.beat-1__tertiary,
	.beat-1__equivalence,
	.beat-1__skip {
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}

	.beat-1__secondary.visible,
	.beat-1__tertiary.visible,
	.beat-1__equivalence.visible,
	.beat-1__skip.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.beat-1__secondary {
		font-family: var(--font-heading);
		font-size: var(--text-3xl);
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: var(--space-2);
	}

	.beat-1__tertiary {
		font-family: var(--font-heading);
		font-size: var(--text-2xl);
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: var(--space-8);
	}

	.beat-1__equivalence {
		font-size: var(--text-base);
		color: rgba(255, 255, 255, 0.5);
		max-width: 36rem;
		line-height: var(--leading-relaxed);
		margin-bottom: var(--space-6);
	}

	.beat-1__skip {
		list-style: none;
		padding: 0;
	}

	.beat-1__skip a {
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-sm);
		text-decoration: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 2px;
		transition: color var(--transition-fast);
	}

	.beat-1__skip a:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	/* ── Beat 2: Reveal ── */
	.beat-2__graphic {
		width: 100%;
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.beat-2__methodology {
		align-self: flex-end;
	}

	/* Narrative text steps (Beat 2 and Beat 4) */
	.narrative-steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding-inline: var(--space-8);
		max-width: 24rem;
	}

	.step__heading {
		font-family: var(--font-heading);
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-3);
		line-height: var(--leading-tight);
	}

	.step__body {
		font-size: var(--text-lg);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
	}

	/* Equivalence callout card */
	.equivalence-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}

	.equivalence-card__label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-4);
	}

	.equivalence-card__comparison {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.equivalence-card__item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.equivalence-card__value {
		font-family: var(--font-heading);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		line-height: 1;
	}

	.equivalence-card__value.wasteful {
		color: var(--color-energy-wasteful);
	}

	.equivalence-card__value.efficient {
		color: var(--color-energy-efficient);
	}

	.equivalence-card__unit {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.equivalence-card__config {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.equivalence-card__vs {
		font-size: var(--text-xl);
		color: var(--color-text-muted);
		font-family: var(--font-heading);
		padding: 0 var(--space-2);
	}

	/* ── Beat 3: Exploration ── */
	.beat-3__intro {
		padding: var(--space-12) var(--space-8);
		max-width: var(--content-max-width);
	}

	.beat-3__heading {
		font-family: var(--font-heading);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-4);
		line-height: var(--leading-tight);
	}

	.beat-3__body {
		font-size: var(--text-lg);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
	}

	.beat-3-explorer {
		width: 100%;
		padding-block: var(--space-8);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.beat-3-explorer__inner {
		max-width: var(--content-wide-width);
		margin-inline: auto;
		padding-inline: var(--space-8);
	}

	/* ── Beat 4: Depth ── */
	.beat-4__graphic {
		width: 100%;
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
	}

	.depth-callout {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--color-primary);
		border-radius: var(--radius-md);
		padding: var(--space-6);
	}

	.depth-callout__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-3);
	}

	.depth-callout__body {
		font-size: var(--text-base);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		margin: 0;
	}

	/* ── Beat 5: Action ── */
	.beat-5 {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-12) var(--space-8);
		max-width: var(--content-wide-width);
		margin-inline: auto;
	}

	.beat-5__header {
		max-width: var(--content-max-width);
	}

	.beat-5__title {
		font-family: var(--font-heading);
		font-size: var(--text-4xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-4);
		line-height: var(--leading-tight);
	}

	.beat-5__intro {
		font-size: var(--text-xl);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin: 0;
	}

	/* Policy lever card */
	.lever {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.lever__header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.lever__number {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--color-primary);
		color: #ffffff;
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.lever__title {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-1);
		font-weight: var(--weight-medium);
	}

	.lever__action {
		font-family: var(--font-heading);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0;
		line-height: var(--leading-tight);
	}

	.lever__body {
		font-size: var(--text-base);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		margin: 0;
		max-width: 56rem;
	}

	.lever-note {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0;
	}

	/* Range indicator (Lever 1) */
	.range-indicator {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius-md);
	}

	.range-indicator__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.range-indicator__bar-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.range-indicator__bar {
		flex: 1;
		height: 0.75rem;
		background: linear-gradient(
			to right,
			var(--color-energy-efficient),
			var(--color-energy-mid-cool),
			var(--color-energy-mid-warm),
			var(--color-energy-wasteful)
		);
		border-radius: 9999px;
	}

	.range-indicator__fill {
		/* purely decorative gradient bar — the fill represents the full range */
		width: 100%;
		height: 100%;
	}

	.range-indicator__end {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		white-space: nowrap;
		font-weight: var(--weight-medium);
	}

	.range-indicator__end--efficient {
		color: var(--color-energy-efficient);
	}

	.range-indicator__end--wasteful {
		color: var(--color-energy-wasteful);
	}

	.range-indicator__sublabel {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Deployment bar chart (Lever 2) */
	.deployment-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius-md);
	}

	.deployment-chart__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		margin-bottom: var(--space-2);
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.bar-label {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text);
		width: 5.5rem;
		flex-shrink: 0;
	}

	.bar-track {
		flex: 1;
		height: 1.5rem;
		background: var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color-primary-light);
		border-radius: var(--radius-sm);
		transition: width 0.4s ease;
	}

	.bar-fill--worst {
		background: var(--color-energy-wasteful);
	}

	.bar-fill--best {
		background: var(--color-energy-efficient);
	}

	.bar-value {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		width: 5rem;
		text-align: right;
		flex-shrink: 0;
	}

	/* Procurement callout (Lever 3) */
	.procurement-callout {
		display: flex;
		gap: var(--space-6);
		align-items: flex-start;
		padding: var(--space-6);
		background: var(--color-bg);
		border-radius: var(--radius-md);
	}

	.procurement-callout__ratio {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}

	.procurement-callout__number {
		font-family: var(--font-heading);
		font-size: var(--text-4xl);
		font-weight: var(--weight-bold);
		line-height: 1;
	}

	.procurement-callout__number.wasteful {
		color: var(--color-energy-wasteful);
	}

	.procurement-callout__label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-align: center;
		max-width: 5rem;
	}

	.procurement-callout__body {
		font-size: var(--text-base);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		margin: 0;
	}

	.beat-5__footer {
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.narrative-steps {
			padding-inline: var(--space-4);
			gap: var(--space-12);
			max-width: 100%;
		}

		.equivalence-card__comparison {
			flex-direction: column;
			gap: var(--space-3);
		}

		.equivalence-card__vs {
			transform: rotate(90deg);
		}

		.beat-3__intro {
			padding: var(--space-8) var(--space-4);
		}

		.beat-3-explorer__inner {
			padding-inline: var(--space-4);
		}

		.beat-5 {
			padding: var(--space-8) var(--space-4);
		}

		.lever {
			padding: var(--space-6) var(--space-4);
		}

		.procurement-callout {
			flex-direction: column;
			gap: var(--space-4);
		}

		.bar-row {
			flex-wrap: wrap;
		}

		.bar-label {
			width: 100%;
		}

		.bar-value {
			width: auto;
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.beat-1__counter,
		.beat-1__secondary,
		.beat-1__tertiary,
		.beat-1__equivalence,
		.beat-1__skip {
			transition: none;
			opacity: 1;
			transform: none;
		}

		.bar-fill {
			transition: none;
		}
	}
</style>
