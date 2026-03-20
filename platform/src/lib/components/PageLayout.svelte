<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		wide?: boolean;
	}

	const { children, wide = false }: Props = $props();
</script>

<div class="page-layout" class:wide>
	{@render children()}
</div>

<style>
	.page-layout {
		width: 100%;
		max-width: var(--content-max-width);
		margin-inline: auto;
		padding-inline: var(--space-6);
		padding-block: var(--space-8);
	}

	.page-layout.wide {
		max-width: var(--content-wide-width);
	}
</style>
