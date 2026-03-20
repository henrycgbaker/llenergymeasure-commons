<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    children: Snippet;
  }

  const { title, children }: Props = $props();
</script>

<section class="section">
  {#if title}
    <h2 class="section-title">{title}</h2>
  {/if}
  <div class="section-body">
    {@render children()}
  </div>
</section>

<style>
  .section {
    margin-block: var(--space-12);
  }

  .section-title {
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid var(--color-border);
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
