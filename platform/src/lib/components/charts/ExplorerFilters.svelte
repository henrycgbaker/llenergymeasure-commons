<script lang="ts">
	import type { ExplorerFilterState } from '$lib/data/types.js';

	interface Props {
		filterState: ExplorerFilterState;
		onFilterChange: (_partial: Partial<ExplorerFilterState>) => void;
	}

	const { filterState, onFilterChange }: Props = $props();

	const backends = [
		{ value: null, label: 'All' },
		{ value: 'pytorch', label: 'PyTorch' },
		{ value: 'vllm', label: 'vLLM' },
		{ value: 'tensorrt', label: 'TensorRT' }
	];

	const attentions = [
		{ value: null, label: 'All' },
		{ value: 'eager', label: 'Eager' },
		{ value: 'sdpa', label: 'SDPA' },
		{ value: 'flash_attention_2', label: 'Flash v2' }
	];

	const precisions = [
		{ value: null, label: 'All' },
		{ value: 'fp16', label: 'FP16' },
		{ value: 'bf16', label: 'BF16' },
		{ value: 'fp32', label: 'FP32' }
	];

	const batchSizes = [
		{ value: null, label: 'All' },
		{ value: 1, label: '1' },
		{ value: 8, label: '8' },
		{ value: 32, label: '32' },
		{ value: 64, label: '64' },
		{ value: 128, label: '128' }
	];
</script>

<div class="filters" role="group" aria-label="Explorer filters">
	<div class="filter-group">
		<span class="filter-group__label" id="explorer-backend-label">Backend</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="explorer-backend-label">
			{#each backends as opt (String(opt.value))}
				<button
					class="segment-btn"
					class:segment-btn--active={filterState.backend === opt.value}
					role="radio"
					aria-checked={filterState.backend === opt.value}
					onclick={() => onFilterChange({ backend: opt.value })}
					type="button">{opt.label}</button
				>
			{/each}
		</div>
	</div>

	<div class="filter-group">
		<span class="filter-group__label" id="explorer-attn-label">Attention</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="explorer-attn-label">
			{#each attentions as opt (String(opt.value))}
				<button
					class="segment-btn"
					class:segment-btn--active={filterState.attn === opt.value}
					role="radio"
					aria-checked={filterState.attn === opt.value}
					onclick={() => onFilterChange({ attn: opt.value })}
					type="button">{opt.label}</button
				>
			{/each}
		</div>
	</div>

	<div class="filter-group">
		<span class="filter-group__label" id="explorer-precision-label">Precision</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="explorer-precision-label">
			{#each precisions as opt (String(opt.value))}
				<button
					class="segment-btn"
					class:segment-btn--active={filterState.precision === opt.value}
					role="radio"
					aria-checked={filterState.precision === opt.value}
					onclick={() => onFilterChange({ precision: opt.value })}
					type="button">{opt.label}</button
				>
			{/each}
		</div>
	</div>

	<div class="filter-group">
		<span class="filter-group__label" id="explorer-batch-label">Batch Size</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="explorer-batch-label">
			{#each batchSizes as opt (String(opt.value))}
				<button
					class="segment-btn"
					class:segment-btn--active={filterState.batchSize === opt.value}
					role="radio"
					aria-checked={filterState.batchSize === opt.value}
					onclick={() => onFilterChange({ batchSize: opt.value })}
					type="button">{opt.label}</button
				>
			{/each}
		</div>
	</div>
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		align-items: flex-end;
		padding-bottom: var(--space-4);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.filter-group__label {
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.segment-group {
		display: flex;
		gap: var(--space-1);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.segment-group::-webkit-scrollbar {
		display: none;
	}

	.segment-btn {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast),
			border-color var(--transition-fast);
		flex-shrink: 0;
	}

	.segment-btn:hover:not(.segment-btn--active) {
		background: var(--color-bg);
		border-color: var(--color-primary-light);
	}

	.segment-btn--active {
		background: var(--color-primary);
		color: var(--color-surface);
		border-color: var(--color-primary);
		font-weight: var(--weight-medium);
	}

	@media (max-width: 600px) {
		.filters {
			flex-direction: column;
			align-items: flex-start;
		}

		.segment-group {
			max-width: 100%;
		}
	}
</style>
