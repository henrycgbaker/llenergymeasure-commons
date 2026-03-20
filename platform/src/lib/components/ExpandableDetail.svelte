<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
		open?: boolean;
	}

	const { title, children, open = false }: Props = $props();
</script>

<details class="expandable" {open}>
	<summary class="expandable-summary">
		<span class="summary-icon" aria-hidden="true"></span>
		{title}
	</summary>
	<div class="expandable-body">
		{@render children()}
	</div>
</details>

<style>
	.expandable {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.expandable-summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-6);
		font-family: var(--font-heading);
		font-weight: var(--weight-bold);
		font-size: var(--text-base);
		color: var(--color-primary);
		list-style: none;
		cursor: pointer;
		user-select: none;
		transition: background-color var(--transition-fast);
	}

	.expandable-summary:hover {
		background-color: var(--color-bg);
		border-radius: var(--radius-md);
	}

	.summary-icon {
		display: inline-block;
		width: 0.6em;
		height: 0.6em;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(-45deg);
		transition: transform var(--transition-fast);
		flex-shrink: 0;
	}

	details[open] .summary-icon {
		transform: rotate(45deg);
	}

	.expandable-body {
		padding: var(--space-4) var(--space-6) var(--space-6);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
