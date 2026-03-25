<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		class?: string;
	}

	const { class: className = '' }: Props = $props();
</script>

<a href="{base}/methodology" class="methodology-link {className}">
	<svg
		class="methodology-icon"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="12" />
		<line x1="12" y1="16" x2="12.01" y2="16" />
	</svg>
	How was this measured?
</a>

<style>
	.methodology-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.methodology-link:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.methodology-icon {
		width: 1em;
		height: 1em;
		flex-shrink: 0;
	}
</style>
