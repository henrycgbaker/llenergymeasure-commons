<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		slug: string;
	}

	const { slug }: Props = $props();

	let siteUrl = $state('');
	let copied = $state(false);

	onMount(() => {
		const envUrl: string =
			(import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;
		siteUrl = envUrl;
	});

	const embedSrc = $derived(`${siteUrl}/embed/${slug}/`);

	const embedCode = $derived(
		`<iframe\n  src="${embedSrc}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border:none; max-width:100%"\n  title="${slug} chart embed"\n  loading="lazy"\n></iframe>\n<script>\n  window.addEventListener('message', function(e) {\n    if (e.data && e.data.type === 'llem-resize') {\n      var iframes = document.querySelectorAll('iframe[src*="${slug}"]');\n      for (var i = 0; i < iframes.length; i++) {\n        iframes[i].style.height = e.data.height + 'px';\n      }\n    }\n  });\n<\\/script>`
	);

	async function copyEmbed() {
		await navigator.clipboard.writeText(embedCode);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class="embed-block">
	<h3 class="embed-block__heading">Embed this chart</h3>
	<p class="embed-block__desc">
		Copy the code below to embed this chart on your website. The iframe automatically resizes to fit
		the chart content.
	</p>
	<pre class="embed-block__code">{embedCode}</pre>
	<button class="embed-block__copy" onclick={copyEmbed} type="button">
		{copied ? 'Copied!' : 'Copy embed code'}
	</button>
	<span class="embed-block__feedback" aria-live="polite">
		{copied ? 'Embed code copied to clipboard' : ''}
	</span>
</div>

<style>
	.embed-block {
		margin-top: var(--space-6);
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.embed-block__heading {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}

	.embed-block__desc {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0 0 var(--space-3);
		max-width: 60ch;
	}

	.embed-block__code {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin: 0 0 var(--space-3);
		white-space: pre-wrap;
		word-break: break-all;
		overflow-x: auto;
	}

	.embed-block__copy {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.embed-block__copy:hover {
		background: var(--color-primary);
		color: #ffffff;
	}

	.embed-block__feedback {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
</style>
