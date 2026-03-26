<script lang="ts">
	import { chartApa, chartBibtex, PLATFORM_APA, PLATFORM_BIBTEX } from '$lib/data/citations.js';

	interface Props {
		chartTitle: string;
		slug: string;
	}

	const { chartTitle, slug }: Props = $props();

	type Format = 'apa' | 'bibtex';
	let activeFormat = $state<Format>('apa');
	let chartCopied = $state(false);
	let platformCopied = $state(false);

	const chartCitation = $derived(
		activeFormat === 'apa' ? chartApa(chartTitle, slug) : chartBibtex(chartTitle, slug)
	);
	const platformCitation = $derived(
		activeFormat === 'apa' ? PLATFORM_APA : PLATFORM_BIBTEX
	);

	async function copyChartCitation() {
		await navigator.clipboard.writeText(chartCitation);
		chartCopied = true;
		setTimeout(() => {
			chartCopied = false;
		}, 2000);
	}

	async function copyPlatformCitation() {
		await navigator.clipboard.writeText(platformCitation);
		platformCopied = true;
		setTimeout(() => {
			platformCopied = false;
		}, 2000);
	}
</script>

<div class="citation-block">
	<h3 class="citation-block__heading">Cite this chart</h3>

	<div class="citation-block__tabs" role="tablist" aria-label="Citation format">
		<button
			role="tab"
			aria-selected={activeFormat === 'apa'}
			class="citation-block__tab"
			class:active={activeFormat === 'apa'}
			onclick={() => (activeFormat = 'apa')}
			type="button"
		>
			APA
		</button>
		<button
			role="tab"
			aria-selected={activeFormat === 'bibtex'}
			class="citation-block__tab"
			class:active={activeFormat === 'bibtex'}
			onclick={() => (activeFormat = 'bibtex')}
			type="button"
		>
			BibTeX
		</button>
	</div>

	<div class="citation-block__entry">
		<p class="citation-block__label">Chart citation</p>
		<pre class="citation-block__code">{chartCitation}</pre>
		<button class="citation-block__copy" onclick={copyChartCitation} type="button">
			{chartCopied ? 'Copied!' : 'Copy'}
		</button>
		<span class="citation-block__feedback" aria-live="polite">
			{chartCopied ? 'Copied to clipboard' : ''}
		</span>
	</div>

	<div class="citation-block__entry">
		<p class="citation-block__label">Platform citation</p>
		<pre class="citation-block__code">{platformCitation}</pre>
		<button class="citation-block__copy" onclick={copyPlatformCitation} type="button">
			{platformCopied ? 'Copied!' : 'Copy'}
		</button>
		<span class="citation-block__feedback" aria-live="polite">
			{platformCopied ? 'Copied to clipboard' : ''}
		</span>
	</div>
</div>

<style>
	.citation-block {
		margin-top: var(--space-8);
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.citation-block__heading {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0 0 var(--space-4);
	}

	.citation-block__tabs {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.citation-block__tab {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
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

	.citation-block__tab.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #ffffff;
	}

	.citation-block__entry {
		margin-bottom: var(--space-6);
		position: relative;
	}

	.citation-block__entry:last-child {
		margin-bottom: 0;
	}

	.citation-block__label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.citation-block__code {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin: 0 0 var(--space-2);
		white-space: pre-wrap;
		word-break: break-all;
		overflow-x: auto;
	}

	.citation-block__copy {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.citation-block__copy:hover {
		background: var(--color-primary);
		color: #ffffff;
	}

	.citation-block__feedback {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
</style>
