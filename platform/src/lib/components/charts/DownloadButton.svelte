<script lang="ts">
	import { toCSV, toJSON, triggerDownload } from '$lib/data/transforms/downloadUtils.js';
	import type { ExperimentResult } from '$lib/data/types.js';

	interface Props {
		results: ExperimentResult[];
		totalCount: number;
		label?: string;
		filenamePrefix?: string;
	}

	const {
		results,
		totalCount,
		label = 'Download data',
		filenamePrefix = 'llem-explorer'
	}: Props = $props();

	const disabled = $derived(results.length === 0);

	function handleCSV() {
		if (disabled) return;
		triggerDownload(
			toCSV(results),
			`${filenamePrefix}-${results.length}configs.csv`,
			'text/csv;charset=utf-8;'
		);
	}

	function handleJSON() {
		if (disabled) return;
		triggerDownload(
			toJSON(results),
			`${filenamePrefix}-${results.length}configs.json`,
			'application/json'
		);
	}
</script>

<div class="download-button">
	<span class="download-label">{label}</span>
	<span class="download-badge">{results.length} of {totalCount} configs</span>
	<div class="download-actions">
		<button
			class="dl-btn"
			{disabled}
			onclick={handleCSV}
			type="button"
			aria-label="Download filtered results as CSV"
		>
			CSV
		</button>
		<button
			class="dl-btn"
			{disabled}
			onclick={handleJSON}
			type="button"
			aria-label="Download filtered results as JSON"
		>
			JSON
		</button>
	</div>
</div>

<style>
	.download-button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.download-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-weight: var(--weight-medium);
	}

	.download-badge {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 0 var(--space-2);
		line-height: 1.6;
		font-variant-numeric: tabular-nums;
	}

	.download-actions {
		display: flex;
		gap: var(--space-1);
	}

	.dl-btn {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		font-size: var(--text-xs);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
		white-space: nowrap;
	}

	.dl-btn:hover:not(:disabled) {
		background: var(--color-primary);
		color: var(--color-surface);
	}

	.dl-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		border-color: var(--color-border);
		color: var(--color-text-muted);
	}
</style>
