<script lang="ts">
	import type { DimensionValue, ExperimentResult, ExplorerFilterState } from '$lib/data/types.js';
	import {
		getAvailableDimensions,
		getDimensionLabel,
		getDimensionValues,
		formatDimensionValue,
		sortDimensionValues
	} from '$lib/data/dimensions.js';

	interface Props {
		allResults: ExperimentResult[];
		filterState: ExplorerFilterState;
		onFilterChange: (_key: string, _value: DimensionValue | null) => void;
	}

	const { allResults, filterState, onFilterChange }: Props = $props();

	// Currently selected backend (if any) drives which dimensions to show
	const selectedBackend = $derived(
		filterState.dimensionFilters.backend as string | null ?? null
	);

	// Common dimensions (present for all backends)
	const commonDims = $derived(['backend', 'precision']);

	// Backend-specific dimensions (shown when a backend is selected)
	const backendDims = $derived(
		selectedBackend
			? getAvailableDimensions(allResults, selectedBackend).filter(
					(k) => !commonDims.includes(k)
				)
			: []
	);

	const allDimsToShow = $derived([...commonDims, ...backendDims]);

	function getOptions(dim: string) {
		const subset = selectedBackend && !commonDims.includes(dim)
			? allResults.filter((r) => r.backend === selectedBackend)
			: allResults;
		const rawValues = getDimensionValues(subset, dim);
		const sorted = sortDimensionValues(rawValues);
		return [
			{ value: null, label: 'All' },
			...sorted.map((v) => ({
				value: v,
				label: formatDimensionValue(dim, v)
			}))
		];
	}
</script>

<div class="filters" role="group" aria-label="Explorer filters">
	{#each allDimsToShow as dim (dim)}
		{@const options = getOptions(dim)}
		{@const labelId = `explorer-${dim}-label`}
		<div class="filter-group">
			<span class="filter-group__label" id={labelId}>{getDimensionLabel(dim)}</span>
			<div class="segment-group" role="radiogroup" aria-labelledby={labelId}>
				{#each options as opt (String(opt.value))}
					<button
						class="segment-btn"
						class:segment-btn--active={filterState.dimensionFilters[dim] === opt.value ||
							(opt.value === null && filterState.dimensionFilters[dim] == null)}
						role="radio"
						aria-checked={filterState.dimensionFilters[dim] === opt.value ||
							(opt.value === null && filterState.dimensionFilters[dim] == null)}
						onclick={() => onFilterChange(dim, opt.value)}
						type="button">{opt.label}</button
					>
				{/each}
			</div>
		</div>
	{/each}
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
