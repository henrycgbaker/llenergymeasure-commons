<script lang="ts">
	import ExpandableDetail from '$lib/components/ExpandableDetail.svelte';
	import { smartphoneCharges, formatEquivalence } from '$lib/data/transforms/equivalences.js';
	import { getDimensionLabel, formatDimensionValue } from '$lib/data/dimensions.js';
	import type { HeatmapCell } from '$lib/data/types.js';

	interface Props {
		cell: HeatmapCell | null;
	}

	const { cell }: Props = $props();

	const equivalence = $derived(cell ? formatEquivalence(smartphoneCharges(cell.energy)) : '');
	const ratioBarWidth = $derived(cell ? Math.min(100, (cell.ratioVsBest / 10) * 100) : 0);
	const ratioLabel = $derived(
		cell ? (cell.ratioVsBest <= 1.05 ? 'Optimal' : `${cell.ratioVsBest.toFixed(1)}x vs best`) : ''
	);
</script>

{#if cell}
	<div class="detail-panel" role="region" aria-label="Selected configuration details">
		<h3 class="detail-panel__title">Configuration Detail</h3>

		<div class="detail-panel__grid">
			<!-- Configuration breakdown -->
			<table class="detail-table">
				<caption class="detail-table__caption">Configuration</caption>
				<tbody>
					{#each Object.entries(cell.dimensions) as [key, value] (key)}
						<tr>
							<td class="detail-table__key">{getDimensionLabel(key)}</td>
							<td class="detail-table__value detail-table__value--mono"
								>{formatDimensionValue(key, value)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Measurements -->
			<table class="detail-table">
				<caption class="detail-table__caption">Measurements</caption>
				<tbody>
					<tr>
						<td class="detail-table__key">Energy/token</td>
						<td class="detail-table__value detail-table__value--mono">
							{cell.energy.toFixed(4)} J
						</td>
					</tr>
					<tr>
						<td class="detail-table__key">Total energy</td>
						<td class="detail-table__value detail-table__value--mono">
							{cell.total_energy_j.toFixed(1)} J
						</td>
					</tr>
					<tr>
						<td class="detail-table__key">Throughput</td>
						<td class="detail-table__value detail-table__value--mono">
							{cell.throughput.toFixed(0)} tok/s
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Ratio bar -->
		<div class="ratio-section">
			<div class="ratio-section__header">
				<span class="ratio-section__label">Efficiency vs best</span>
				<span
					class="ratio-section__value"
					class:ratio-section__value--optimal={cell.ratioVsBest <= 1.05}
					class:ratio-section__value--bad={cell.ratioVsBest > 4}>{ratioLabel}</span
				>
			</div>
			<div
				class="ratio-bar"
				role="meter"
				aria-valuenow={cell.ratioVsBest}
				aria-valuemin={1}
				aria-valuemax={10}
			>
				<div
					class="ratio-bar__fill"
					class:ratio-bar__fill--optimal={cell.ratioVsBest <= 1.05}
					class:ratio-bar__fill--bad={cell.ratioVsBest > 4}
					style="width: {ratioBarWidth}%"
				></div>
			</div>
		</div>

		<!-- Deployment equivalence -->
		<div class="equivalence">
			<span class="equivalence__label">At 10M queries/month:</span>
			<span class="equivalence__value">{equivalence} per month</span>
		</div>

		<!-- Technical depth via ExpandableDetail -->
		<ExpandableDetail title="Technical details">
			<p class="detail-note">
				Energy per token is measured as total GPU energy divided by output tokens generated, under
				steady-state conditions with warm-up samples excluded. Ratio vs best is computed within the
				same filter slice so configurations are directly comparable.
			</p>
			<p class="detail-note">
				Smartphone equivalence assumes 128 output tokens/query, 12 Wh per full charge, and a 10M
				queries/month deployment scale.
			</p>
		</ExpandableDetail>
	</div>
{/if}

<style>
	.detail-panel {
		margin-top: var(--space-6);
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		animation: panel-in 200ms ease;
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.detail-panel__title {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-primary);
		margin: 0;
	}

	.detail-panel__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	@media (max-width: 600px) {
		.detail-panel__grid {
			grid-template-columns: 1fr;
		}
	}

	.detail-table {
		border-collapse: collapse;
		width: 100%;
		font-size: var(--text-sm);
	}

	.detail-table__caption {
		text-align: left;
		font-weight: var(--weight-bold);
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-bottom: var(--space-2);
	}

	.detail-table__key {
		color: var(--color-text-muted);
		padding: var(--space-1) var(--space-2) var(--space-1) 0;
		width: 45%;
	}

	.detail-table__value {
		color: var(--color-text);
		font-weight: var(--weight-medium);
		padding: var(--space-1) 0;
	}

	.detail-table__value--mono {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.ratio-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.ratio-section__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.ratio-section__label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.ratio-section__value {
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.ratio-section__value--optimal {
		color: var(--color-energy-efficient);
	}

	.ratio-section__value--bad {
		color: var(--color-energy-wasteful);
	}

	.ratio-bar {
		height: 8px;
		background: var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.ratio-bar__fill {
		height: 100%;
		background: var(--color-energy-mid-warm);
		border-radius: var(--radius-sm);
		transition: width var(--transition-normal);
	}

	.ratio-bar__fill--optimal {
		background: var(--color-energy-efficient);
	}

	.ratio-bar__fill--bad {
		background: var(--color-energy-wasteful);
	}

	.equivalence {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
	}

	.equivalence__label {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.equivalence__value {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	.detail-note {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0;
	}
</style>
