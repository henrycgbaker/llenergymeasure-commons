<script lang="ts">
	interface Tab {
		id: string;
		label: string;
	}

	interface Props {
		activeTab: string;
		onTabChange: (_tab: string) => void;
	}

	const { activeTab, onTabChange }: Props = $props();

	const tabs: Tab[] = [
		{ id: 'surface', label: '3D Surface' },
		{ id: 'pca', label: 'PCA Projection' },
		{ id: 'parallel', label: 'Parallel Coordinates' },
		{ id: 'heatmap', label: 'Heatmap' }
	];

	// WAI-ARIA tabs pattern: arrow keys navigate between tabs
	function handleTabKeydown(event: KeyboardEvent, tabId: string) {
		const currentIdx = tabs.findIndex((t) => t.id === tabId);

		switch (event.key) {
			case 'ArrowRight': {
				event.preventDefault();
				const nextIdx = (currentIdx + 1) % tabs.length;
				onTabChange(tabs[nextIdx].id);
				break;
			}
			case 'ArrowLeft': {
				event.preventDefault();
				const prevIdx = (currentIdx - 1 + tabs.length) % tabs.length;
				onTabChange(tabs[prevIdx].id);
				break;
			}
			case 'Home': {
				event.preventDefault();
				onTabChange(tabs[0].id);
				break;
			}
			case 'End': {
				event.preventDefault();
				onTabChange(tabs[tabs.length - 1].id);
				break;
			}
		}
	}
</script>

<div class="tabs" role="tablist" aria-label="Explorer visualisations">
	{#each tabs as tab (tab.id)}
		<button
			class="tab-btn"
			class:tab-btn--active={activeTab === tab.id}
			role="tab"
			aria-selected={activeTab === tab.id}
			aria-controls="tabpanel-{tab.id}"
			id="tab-{tab.id}"
			tabindex={activeTab === tab.id ? 0 : -1}
			onclick={() => onTabChange(tab.id)}
			onkeydown={(e) => handleTabKeydown(e, tab.id)}
			type="button"
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab-btn {
		padding: var(--space-3) var(--space-5);
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		font-weight: var(--weight-medium);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast);
		margin-bottom: -1px;
	}

	.tab-btn:hover:not(.tab-btn--active) {
		color: var(--color-text);
		border-bottom-color: var(--color-border);
	}

	.tab-btn--active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
		font-weight: var(--weight-bold);
	}

	.tab-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}
</style>
