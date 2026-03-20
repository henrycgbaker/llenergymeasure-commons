<script lang="ts">
	interface ConfigOption {
		label: string;
		id: string;
	}

	interface Props {
		playing: boolean;
		progress: number;
		visible: boolean;
		configs: ConfigOption[];
		leftConfigId: string;
		rightConfigId: string;
		onPlay: () => void;
		onPause: () => void;
		onSeek: (_progress: number) => void;
		onLeftChange: (_id: string) => void;
		onRightChange: (_id: string) => void;
	}

	const {
		playing,
		progress,
		visible,
		configs,
		leftConfigId,
		rightConfigId,
		onPlay,
		onPause,
		onSeek,
		onLeftChange,
		onRightChange
	}: Props = $props();

	function handleRangeInput(e: Event) {
		const input = e.target as HTMLInputElement;
		onSeek(parseFloat(input.value));
	}

	function handleLeftChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		onLeftChange(select.value);
	}

	function handleRightChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		onRightChange(select.value);
	}
</script>

<div class="timeseries-controls" class:visible>
	<!-- Play/pause + scrub -->
	<div class="controls-row">
		<button
			class="play-pause-btn"
			onclick={playing ? onPause : onPlay}
			aria-label={playing ? 'Pause' : 'Play'}
		>
			{#if playing}
				<!-- Pause icon -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<rect x="6" y="4" width="4" height="16" />
					<rect x="14" y="4" width="4" height="16" />
				</svg>
			{:else}
				<!-- Play icon -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<polygon points="5,3 19,12 5,21" />
				</svg>
			{/if}
		</button>

		<input
			type="range"
			class="scrub-slider"
			min="0"
			max="1"
			step="0.001"
			value={progress}
			oninput={handleRangeInput}
			aria-label="Scrub timeline"
		/>
	</div>

	<!-- Configuration selectors -->
	<div class="config-selectors">
		<div class="config-selector">
			<label class="config-label" for="left-config-select">Left panel</label>
			<select
				id="left-config-select"
				class="config-select"
				value={leftConfigId}
				onchange={handleLeftChange}
			>
				{#each configs as config (config.id)}
					<option value={config.id}>{config.label}</option>
				{/each}
			</select>
		</div>

		<div class="config-selector">
			<label class="config-label" for="right-config-select">Right panel</label>
			<select
				id="right-config-select"
				class="config-select"
				value={rightConfigId}
				onchange={handleRightChange}
			>
				{#each configs as config (config.id)}
					<option value={config.id}>{config.label}</option>
				{/each}
			</select>
		</div>
	</div>
</div>

<style>
	.timeseries-controls {
		display: none;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.timeseries-controls.visible {
		display: flex;
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.play-pause-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem;
		flex-shrink: 0;
		transition: background-color var(--transition-fast);
	}

	.play-pause-btn:hover {
		background: var(--color-primary);
		color: #ffffff;
		border-color: var(--color-primary);
	}

	.play-pause-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.scrub-slider {
		flex: 1;
		height: 0.375rem;
		-webkit-appearance: none;
		appearance: none;
		background: var(--color-border);
		border-radius: 9999px;
		outline: none;
		cursor: pointer;
	}

	.scrub-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: 2px solid #ffffff;
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	.scrub-slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: 2px solid #ffffff;
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	.config-selectors {
		display: flex;
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	.config-selector {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 12rem;
	}

	.config-label {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: var(--weight-medium);
	}

	.config-select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-family: var(--font-mono);
		cursor: pointer;
		width: 100%;
	}

	.config-select:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	@media (max-width: 480px) {
		.config-selectors {
			flex-direction: column;
		}
	}
</style>
