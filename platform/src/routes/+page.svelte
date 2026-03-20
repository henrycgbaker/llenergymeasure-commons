<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ScrollNarrative from '$lib/components/scroll/ScrollNarrative.svelte';
	import NarrativeSection from '$lib/components/scroll/NarrativeSection.svelte';
	import ConfigHeatmap from '$lib/components/charts/ConfigHeatmap.svelte';
	import MethodologyLink from '$lib/components/charts/MethodologyLink.svelte';
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

		// Set up scroll tracking for Beat 2
		const handleScroll = () => trackBeat2Progress();
		window.addEventListener('scroll', handleScroll, { passive: true });
		// Initial check
		trackBeat2Progress();

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
	     Beat 3: Exploration — interactive heatmap placeholder
	     ======================================================== -->
	<NarrativeSection id="beat-3">
		<div class="placeholder-beat">
			<h2 class="placeholder-beat__heading">Explore the full landscape</h2>
			<p class="placeholder-beat__body">
				Interactive configuration explorer coming in the next phase. Filter by backend
				(PyTorch / vLLM / TensorRT), attention type, and metric.
			</p>
			<p class="placeholder-beat__coming-soon">Phase 3 &mdash; coming soon</p>
		</div>
	</NarrativeSection>

	<!-- ========================================================
	     Beat 4: Depth — power timeseries placeholder
	     ======================================================== -->
	<NarrativeSection id="beat-4">
		<div class="placeholder-beat">
			<h2 class="placeholder-beat__heading">Watch energy draw over time</h2>
			<p class="placeholder-beat__body">
				Animated side-by-side power timeseries showing worst-case vs best-case inference.
				The difference is physical — you can see it as motion.
			</p>
			<p class="placeholder-beat__coming-soon">Phase 3 &mdash; coming soon</p>
		</div>
	</NarrativeSection>

	<!-- ========================================================
	     Beat 5: Action — policy levers placeholder
	     ======================================================== -->
	<NarrativeSection id="beat-5">
		<div class="placeholder-beat">
			<h2 class="placeholder-beat__heading">Three levers for policy</h2>
			<p class="placeholder-beat__body">
				Regulation, deployment, and procurement actions that can close the 8x gap today —
				no new technology required.
			</p>
			<p class="placeholder-beat__coming-soon">Phase 3 &mdash; coming soon</p>
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

	/* Narrative text steps (Beat 2) */
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

	/* ── Placeholder beats (3-5) ── */
	.placeholder-beat {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: var(--space-12) var(--space-8);
		max-width: var(--content-max-width);
		margin-inline: auto;
	}

	.placeholder-beat__heading {
		font-family: var(--font-heading);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-4);
	}

	.placeholder-beat__body {
		font-size: var(--text-lg);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		margin-bottom: var(--space-6);
		max-width: 38rem;
	}

	.placeholder-beat__coming-soon {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-style: italic;
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

		.placeholder-beat {
			padding: var(--space-8) var(--space-4);
		}
	}
</style>
