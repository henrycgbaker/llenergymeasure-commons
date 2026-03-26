<script lang="ts">
	import type { DimensionValue, ExperimentResult } from '$lib/data/types.js';
	import {
		getAvailableDimensions,
		getDimensionLabel,
		getDimensionValues,
		formatDimensionValue,
		sortDimensionValues
	} from '$lib/data/dimensions.js';

	interface Props {
		allResults: ExperimentResult[];
		selectedBackend: string;
		dimensionFilters: Record<string, DimensionValue>;
		selectedMetric: string;
		onBackendChange: (_v: string) => void;
		onDimensionFilterChange: (_key: string, _v: DimensionValue) => void;
		onMetricChange: (_v: string) => void;
	}

	const {
		allResults,
		selectedBackend,
		dimensionFilters,
		selectedMetric,
		onBackendChange,
		onDimensionFilterChange,
		onMetricChange
	}: Props = $props();

	const backends = $derived(
		sortDimensionValues(getDimensionValues(allResults, 'backend')) as string[]
	);

	const backendLabels: Record<string, string> = {
		pytorch: 'PyTorch',
		vllm: 'vLLM',
		tensorrt: 'TensorRT'
	};

	// Dimensions available for the selected backend (excluding backend itself)
	const filterableDims = $derived(
		getAvailableDimensions(allResults, selectedBackend).filter(
			(k) => k !== 'backend'
		)
	);

	const metrics = [
		{ value: 'energy', label: 'Energy per token' },
		{ value: 'throughput', label: 'Throughput' }
	];

	function getOptions(dim: string) {
		const subset = allResults.filter((r) => r.backend === selectedBackend);
		const rawValues = getDimensionValues(subset, dim);
		return sortDimensionValues(rawValues);
	}
</script>

<div class="filters" role="group" aria-label="Heatmap filters">
	<div class="filter-group">
		<span class="filter-group__label" id="backend-label">Backend</span>
		<div class="segment-group" role="radiogroup" aria-labelledby="backend-label">
			{#each backends as value (value)}
				<button
					class="segment-btn"
					class:segment-btn--active={selectedBackend === value}
					role="radio"
					aria-checked={selectedBackend === value}
					onclick={() => onBackendChange(value)}
					type="button">{backendLabels[value] ?? value}</button
				>
			{/each}
		</div>
	</div>

	{#each filterableDims as dim (dim)}
		{@const options = getOptions(dim)}
		{@const labelId = `heatmap-${dim}-label`}
		{@const currentValue = dimensionFilters[dim]}
		{#if options.length > 1}
			<div class="filter-group">
				<span class="filter-group__label" id={labelId}>{getDimensionLabel(dim)}</span>
				<div class="segment-group" role="radiogroup" aria-labelledby={labelId}>
					{#each options as opt (String(opt))}
						<button
							class="segment-btn"
							class:segment-btn--active={currentValue === opt}
							role="radio"
							aria-checked={currentValue === opt}
							onclick={() => onDimensionFilterChange(dim, opt)}
							type="button">{formatDimensionValue(dim, opt)}</button
						>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

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
					type="button">{label}</button
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
