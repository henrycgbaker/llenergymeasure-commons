<script lang="ts">
	import '../app.css';
	import DataBanner from '$lib/components/DataBanner.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<DataBanner />
{@render children()}
