<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		children: Snippet;
		graphic?: Snippet;
		fullViewport?: boolean;
	}

	const { id, children, graphic, fullViewport = false }: Props = $props();
</script>

{#if fullViewport}
	<section {id} class="scrolly scrolly--full-viewport">
		<div class="scrolly__full-content">
			{@render children()}
		</div>
	</section>
{:else}
	<section {id} class="scrolly">
		{#if graphic}
			<div class="scrolly__graphic">
				{@render graphic()}
			</div>
		{/if}
		<div class="scrolly__steps" class:scrolly__steps--no-graphic={!graphic}>
			{@render children()}
		</div>
	</section>
{/if}

<style>
	.scrolly {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: var(--space-8);
		width: 100%;
	}

	.scrolly__graphic {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 55%;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.scrolly__steps {
		flex: 1;
		min-width: 0;
		padding-block: 50vh;
	}

	.scrolly__steps--no-graphic {
		padding-block: var(--space-16);
	}

	/* Full-viewport beat layout (Beat 1) */
	.scrolly--full-viewport {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.scrolly__full-content {
		width: 100%;
		max-width: var(--content-wide-width);
		padding-inline: var(--space-8);
	}

	/* Responsive: mobile */
	@media (max-width: 768px) {
		.scrolly {
			flex-direction: column;
			gap: 0;
		}

		.scrolly__graphic {
			position: sticky;
			top: 0;
			height: 60vh;
			min-height: 300px;
			width: 100%;
		}

		.scrolly__steps {
			padding-block: var(--space-12);
		}

		.scrolly__full-content {
			padding-inline: var(--space-4);
		}
	}
</style>
