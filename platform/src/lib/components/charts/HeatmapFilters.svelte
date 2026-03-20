<script lang="ts">
	interface Props {
		selectedBackend: string;
		selectedAttn: string;
		selectedMetric: string;
		onBackendChange: (value: string) => void;
		onAttnChange: (value: string) => void;
		onMetricChange: (value: string) => void;
	}

	const {
		selectedBackend,
		selectedAttn,
		selectedMetric,
		onBackendChange,
		onAttnChange,
		onMetricChange
	}: Props = $props();

	const backends = [
		{ value: 'pytorch', label: 'PyTorch' },
		{ value: 'vllm', label: 'vLLM' },
		{ value: 'tensorrt', label: 'TensorRT' }
	];

	const attentions = [
		{ value: 'eager', label: 'eager' },
		{ value: 'sdpa', label: 'SDPA' },
		{ value: 'flash_attention_2', label: 'Flash v2' }
	];

	const metrics = [
		{ value: 'energy', label: 'Energy per token' },
		{ value: 'throughput', label: 'Throughput' }
	];
</script>

<div class="filters" role="group" aria-label="Heatmap filters">
	<div class="filter-group">
		<span class="filter-group__label" id="backend-label">Backend</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="backend-label">
			{#each backends as { value, label } (value)}
				<button
					class="segment-btn"
					class:segment-btn--active={selectedBackend === value}
					role="radio"
					aria-checked={selectedBackend === value}
					onclick={() => onBackendChange(value)}
					type="button"
				>{label}</button>
			{/each}
		</div>
	</div>

	<div class="filter-group">
		<span class="filter-group__label" id="attn-label">Attention</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="attn-label">
			{#each attentions as { value, label } (value)}
				<button
					class="segment-btn"
					class:segment-btn--active={selectedAttn === value}
					role="radio"
					aria-checked={selectedAttn === value}
					onclick={() => onAttnChange(value)}
					type="button"
				>{label}</button>
			{/each}
		</div>
	</div>

	<div class="filter-group">
		<span class="filter-group__label" id="metric-label">Metric</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="metric-label">
			{#each metrics as { value, label } (value)}
				<button
					class="segment-btn"
					class:segment-btn--active={selectedMetric === value}
					role="radio"
					aria-checked={selectedMetric === value}
					onclick={() => onMetricChange(value)}
					type="button"
				>{label}</button>
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
		/* Hide scrollbar but keep scroll functionality */
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
