<script lang="ts">
	interface Props {
		show?: boolean;
	}

	const { show = true }: Props = $props();
</script>

{#if show}
	<aside class="data-banner" role="note" aria-label="Preview data notice">
		<span class="banner-icon" aria-hidden="true">&#9888;</span>
		<div class="banner-content">
			<strong>Real Measurements (v1)</strong> - This site uses 37 experiments measured on an NVIDIA
			A100-PCIE-40GB GPU using the llenergymeasure benchmark protocol. Data collected 2026-03-26.
		</div>
	</aside>
{/if}

<style>
	.data-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-banner-bg);
		border-left: 4px solid var(--color-banner-border);
		color: var(--color-banner-text);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
	}

	.banner-icon {
		flex-shrink: 0;
		font-size: var(--text-lg);
		line-height: 1.4;
		color: var(--color-banner-border);
	}

	.banner-content {
		flex: 1;
	}

	.banner-content strong {
		font-family: var(--font-heading);
		font-weight: var(--weight-bold);
		color: var(--color-banner-text);
	}
</style>
