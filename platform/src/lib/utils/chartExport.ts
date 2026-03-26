import { toPng } from 'html-to-image';

const TITLE_AREA_HEIGHT = 60;
const ATTRIBUTION_AREA_HEIGHT = 40;
const PLOTLY_WIDTH = 1200;
const PLOTLY_HEIGHT = 800;

/**
 * Export a DOM element (e.g. a D3 chart container) as a 2x-resolution PNG.
 * Triggers a browser download.
 */
export async function exportChartAsPng(containerEl: HTMLElement, filename: string): Promise<void> {
	try {
		const dataUrl = await toPng(containerEl, {
			pixelRatio: 2,
			backgroundColor: '#ffffff'
		});
		triggerDataUrlDownload(dataUrl, filename);
	} catch (err) {
		console.error('[chartExport] exportChartAsPng failed:', err);
	}
}

/**
 * Export an SVG element as a self-contained SVG file with inlined CSS variable values.
 * Triggers a browser download.
 */
export async function exportChartAsSvg(svgEl: SVGSVGElement, filename: string): Promise<void> {
	try {
		const clone = svgEl.cloneNode(true) as SVGSVGElement;
		inlineCssVars(svgEl, clone);

		const serialiser = new XMLSerializer();
		const svgString = serialiser.serializeToString(clone);
		const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		triggerUrlDownload(url, filename);
		URL.revokeObjectURL(url);
	} catch (err) {
		console.error('[chartExport] exportChartAsSvg failed:', err);
	}
}

/**
 * Recursively resolve var(--*) references in fill, stroke, and color attributes
 * by reading computed styles from the original element tree.
 */
function inlineCssVars(original: SVGElement, clone: SVGElement): void {
	const attrs = ['fill', 'stroke', 'color'];
	for (const attr of attrs) {
		const value = clone.getAttribute(attr);
		if (value && value.startsWith('var(')) {
			const varName = value.slice(4, -1).trim();
			const computed = window.getComputedStyle(original).getPropertyValue(varName).trim();
			if (computed) {
				clone.setAttribute(attr, computed);
			}
		}
	}

	const originalChildren = Array.from(original.children) as SVGElement[];
	const cloneChildren = Array.from(clone.children) as SVGElement[];
	for (let i = 0; i < originalChildren.length; i++) {
		if (cloneChildren[i]) {
			inlineCssVars(originalChildren[i], cloneChildren[i]);
		}
	}
}

type PlotlyLike = {
	toImage: (el: HTMLElement, opts: unknown) => Promise<string>;
};

/**
 * Export a Plotly chart as a composited PNG with title text at top and attribution at bottom.
 * The canvas is sized to 1200x(800 + title area + attribution area).
 * Triggers a browser download.
 */
export async function exportPlotlyPng(
	plotDiv: HTMLElement,
	filename: string,
	plotly: unknown,
	title: string,
	attribution: string
): Promise<void> {
	try {
		const p = plotly as PlotlyLike;
		const plotlyDataUrl = await p.toImage(plotDiv, {
			format: 'png',
			width: PLOTLY_WIDTH,
			height: PLOTLY_HEIGHT
		});

		const totalHeight = TITLE_AREA_HEIGHT + PLOTLY_HEIGHT + ATTRIBUTION_AREA_HEIGHT;
		const canvas = document.createElement('canvas') as HTMLCanvasElement;
		canvas.width = PLOTLY_WIDTH;
		canvas.height = totalHeight;

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not get canvas 2d context');

		// White background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, PLOTLY_WIDTH, totalHeight);

		// Title at top centre
		ctx.fillStyle = '#1a1a1a';
		ctx.font = 'bold 16px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(title, PLOTLY_WIDTH / 2, TITLE_AREA_HEIGHT / 2);

		// Load Plotly image and draw it below the title area
		await new Promise<void>((resolve, reject) => {
			const img = document.createElement('img') as unknown as HTMLImageElement;
			img.onload = () => {
				// img is an HTMLImageElement which is a valid CanvasImageSource
				ctx.drawImage(img, 0, TITLE_AREA_HEIGHT);
				resolve();
			};
			img.onerror = reject;
			img.src = plotlyDataUrl;
		});

		// Attribution at bottom centre
		ctx.fillStyle = '#888888';
		ctx.font = '12px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			attribution,
			PLOTLY_WIDTH / 2,
			TITLE_AREA_HEIGHT + PLOTLY_HEIGHT + ATTRIBUTION_AREA_HEIGHT / 2
		);

		const compositedUrl = canvas.toDataURL('image/png');
		triggerDataUrlDownload(compositedUrl, filename);
	} catch (err) {
		console.error('[chartExport] exportPlotlyPng failed:', err);
	}
}

// ---- internal download helpers ----

function triggerDataUrlDownload(dataUrl: string, filename: string): void {
	const a = document.createElement('a') as HTMLAnchorElement;
	a.download = filename;
	a.href = dataUrl;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function triggerUrlDownload(url: string, filename: string): void {
	const a = document.createElement('a') as HTMLAnchorElement;
	a.download = filename;
	a.href = url;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
