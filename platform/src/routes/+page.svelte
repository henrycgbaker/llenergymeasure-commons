<script lang="ts">
	// Home page stub - Phase 2 replaces this with the scroll narrative
</script>

<svelte:head>
	<title>LLM Energy Commons</title>
</svelte:head>

<main>
	<header class="site-header">
		<h1>LLM Energy Commons</h1>
		<p class="tagline">
			Same model. Same GPU. <strong>8x energy difference.</strong><br />
			Implementation choices - not model selection - are the primary lever for AI energy efficiency.
		</p>
	</header>

	<section class="intro">
		<p>
			This site presents evidence from systematic measurements of LLM inference energy consumption
			across hundreds of configuration combinations. The story it tells is counterintuitive: the
			choice of precision, batch size, attention implementation, and inference backend matters far
			more than which model you choose.
		</p>
		<p>
			The interactive data explorer and full narrative are coming in the next phase. For now, read
			about <a href="/methodology">how we measure</a> and what the data covers.
		</p>
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}

	.site-header {
		padding-block: var(--space-12);
		border-bottom: 3px solid var(--color-primary);
	}

	.site-header h1 {
		font-size: var(--text-4xl);
		margin-bottom: var(--space-4);
	}

	.tagline {
		font-size: var(--text-xl);
		font-family: var(--font-heading);
		color: var(--color-text);
		line-height: var(--leading-relaxed);
		max-width: 40rem;
	}

	.tagline strong {
		color: var(--color-energy-wasteful);
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: var(--content-max-width);
	}

	.intro p {
		font-size: var(--text-lg);
		line-height: var(--leading-relaxed);
	}
</style>
