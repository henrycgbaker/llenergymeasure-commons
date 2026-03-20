<script lang="ts">
  import '../app.css';
  import DataBanner from '$lib/components/DataBanner.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<DataBanner />
<PageLayout>
  {@render children()}
</PageLayout>
