<script lang="ts">
	import { smartphoneCharges, formatEquivalence } from '$lib/data/transforms/equivalences.js';
	import type { HeatmapCell } from '$lib/data/types.js';

	interface Props {
		cell: HeatmapCell | null;
		x: number;
		y: number;
		visible: boolean;
		containerWidth?: number;
	}

	const { cell, x, y, visible, containerWidth = 500 }: Props = $props();

	const TOOLTIP_WIDTH = 220;

	// Flip left if too close to right edge
	const adjustedX = $derived(x + TOOLTIP_WIDTH > containerWidth ? x - TOOLTIP_WIDTH - 8 : x + 12);

	const formattedEnergy = $derived(cell ? cell.energy.toFixed(4) : '');
	const ratioText = $derived(
		cell
			? cell.ratioVsBest <= 1.05
				? 'Optimal configuration'
				: `${cell.ratioVsBest.toFixed(1)}x more than optimal`
			: ''
	);
	const equivalenceText = $derived(cell ? formatEquivalence(smartphoneCharges(cell.energy)) : '');
</script>

{#if visible && cell}
	<div
		class="tooltip"
		style="left: {adjustedX}px; top: {y - 8}px;"
		role="tooltip"
		aria-live="polite"
	>
		<div class="tooltip__label">{cell.label}</div>
		<div class="tooltip__row">
			<span class="tooltip__key">Energy</span>
			<span class="tooltip__value">{formattedEnergy} J/token</span>
		</div>
		<div class="tooltip__row">
			<span class="tooltip__key">vs best</span>
			<span
				class="tooltip__value"
				class:tooltip__value--efficient={cell.ratioVsBest <= 1.05}
				class:tooltip__value--wasteful={cell.ratioVsBest > 2}>{ratioText}</span
			>
		</div>
		<div class="tooltip__equivalence">
			= {equivalenceText} per 10M queries/month
		</div>
	</div>
{/if}

<style>
	.tooltip {
		position: absolute;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		pointer-events: none;
		font-size: var(--text-sm);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		z-index: 20;
		white-space: nowrap;
		opacity: 1;
		transition: opacity var(--transition-fast);
		max-width: 240px;
	}

	.tooltip__label {
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin-bottom: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.tooltip__row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-1);
	}

	.tooltip__key {
		color: var(--color-text-muted);
	}

	.tooltip__value {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.tooltip__value--efficient {
		color: var(--color-energy-efficient);
	}

	.tooltip__value--wasteful {
		color: var(--color-energy-wasteful);
	}

	.tooltip__equivalence {
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		white-space: normal;
		max-width: 200px;
	}

	/* Mobile: render as centred overlay */
	@media (max-width: 600px) {
		.tooltip {
			position: fixed;
			left: 50% !important;
			top: 50% !important;
			transform: translate(-50%, -50%);
			white-space: normal;
			max-width: 90vw;
			pointer-events: auto;
			z-index: 100;
		}
	}
</style>
