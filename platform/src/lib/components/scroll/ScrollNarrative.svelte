<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	// Scroll progress per beat, keyed by section id (for future use by child components)
	let beatProgress: Record<string, number> = $state({});

	let containerEl: HTMLElement;

	onMount(() => {
		if (!browser) return;

		let cleanup: (() => void) | undefined;

		// Dynamically import GSAP to avoid SSR issues
		import('gsap').then(async ({ gsap }) => {
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');

			gsap.registerPlugin(ScrollTrigger);

			// Create a GSAP context scoped to the container element
			const ctx = gsap.context(() => {
				// Only apply GSAP pinning on pointer (non-touch) devices.
				// Touch devices rely on CSS position: sticky alone (avoids iOS pin jitter).
				ScrollTrigger.matchMedia({
					'(hover: hover)': function () {
						// Desktop: use GSAP ScrollTrigger for precise scroll progress tracking
						const sections = containerEl.querySelectorAll('[id^="beat-"]');

						sections.forEach((section) => {
							const sectionId = section.id;
							const graphicEl = section.querySelector('.scrolly__graphic');

							// Track scroll progress for each beat
							ScrollTrigger.create({
								trigger: section,
								start: 'top top',
								end: 'bottom bottom',
								scrub: true,
								onUpdate: (self) => {
									beatProgress = { ...beatProgress, [sectionId]: self.progress };
								}
							});

							// Pin the graphic panel on desktop (if it exists)
							if (graphicEl) {
								ScrollTrigger.create({
									trigger: section,
									start: 'top top',
									end: 'bottom bottom',
									pin: graphicEl,
									pinSpacing: false
								});
							}
						});
					},
					// Touch devices: CSS sticky only, no GSAP pinning
					'(hover: none)': function () {
						const sections = containerEl.querySelectorAll('[id^="beat-"]');

						sections.forEach((section) => {
							const sectionId = section.id;

							ScrollTrigger.create({
								trigger: section,
								start: 'top center',
								end: 'bottom center',
								scrub: true,
								onUpdate: (self) => {
									beatProgress = { ...beatProgress, [sectionId]: self.progress };
								}
							});
						});
					}
				});
			}, containerEl);

			cleanup = () => ctx.revert();
		});

		return () => {
			cleanup?.();
		};
	});
</script>

<div
	class="scroll-narrative"
	bind:this={containerEl}
	data-beat-count={Object.keys(beatProgress).length}
>
	{@render children()}
</div>

<style>
	.scroll-narrative {
		width: 100%;
	}
</style>
