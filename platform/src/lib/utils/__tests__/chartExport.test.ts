import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL
if (!URL.createObjectURL) {
	URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
}
if (!URL.revokeObjectURL) {
	URL.revokeObjectURL = vi.fn();
}

// Mock html-to-image before importing the module under test
vi.mock('html-to-image', () => ({
	toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpng')
}));

import { exportChartAsPng, exportChartAsSvg, exportPlotlyPng } from '../chartExport.js';
import * as htmlToImage from 'html-to-image';

// ---- helpers ----

function makeMockElement(tagName = 'div'): HTMLElement {
	return document.createElement(tagName);
}

function makeMockSvg(): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
	const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGElement;
	rect.setAttribute('fill', 'var(--color-primary)');
	svg.appendChild(rect);
	return svg;
}

// ---- exportChartAsPng ----

describe('exportChartAsPng', () => {
	let clickSpy: ReturnType<typeof vi.fn>;
	let createdAnchor: HTMLAnchorElement | null;

	beforeEach(() => {
		clickSpy = vi.fn();
		createdAnchor = null;

		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'a') {
				const a = Object.assign(document.createElementNS('http://www.w3.org/1999/xhtml', 'a'), {
					click: clickSpy
				}) as unknown as HTMLAnchorElement;
				createdAnchor = a;
				return a;
			}
			return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
		});

		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
		vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls toPng with pixelRatio: 2 and white background', async () => {
		const el = makeMockElement();
		await exportChartAsPng(el, 'test-chart.png');

		expect(htmlToImage.toPng).toHaveBeenCalledWith(
			el,
			expect.objectContaining({ pixelRatio: 2, backgroundColor: '#ffffff' })
		);
	});

	it('triggers a download with the correct filename', async () => {
		const el = makeMockElement();
		await exportChartAsPng(el, 'my-chart.png');

		expect(clickSpy).toHaveBeenCalled();
		expect(createdAnchor?.download).toBe('my-chart.png');
	});

	it('handles errors gracefully without throwing', async () => {
		vi.mocked(htmlToImage.toPng).mockRejectedValueOnce(new Error('canvas error'));
		const el = makeMockElement();
		await expect(exportChartAsPng(el, 'chart.png')).resolves.toBeUndefined();
	});
});

// ---- exportChartAsSvg ----

describe('exportChartAsSvg', () => {
	let clickSpy: ReturnType<typeof vi.fn>;
	let createdAnchor: HTMLAnchorElement | null;

	beforeEach(() => {
		clickSpy = vi.fn();
		createdAnchor = null;

		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'a') {
				const a = Object.assign(document.createElementNS('http://www.w3.org/1999/xhtml', 'a'), {
					click: clickSpy
				}) as unknown as HTMLAnchorElement;
				createdAnchor = a;
				return a;
			}
			if (tag === 'canvas') {
				return document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas') as HTMLElement;
			}
			return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
		});

		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
		vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

		// getComputedStyle returns a value for CSS vars in test env (may be empty string)
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			getPropertyValue: () => '#2166ac'
		} as unknown as CSSStyleDeclaration);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('triggers a download with the correct filename', async () => {
		const svg = makeMockSvg();
		await exportChartAsSvg(svg, 'chart.svg');

		expect(clickSpy).toHaveBeenCalled();
		expect(createdAnchor?.download).toBe('chart.svg');
	});

	it('handles errors gracefully without throwing', async () => {
		// Pass a non-SVG to trigger an error path
		const svg = makeMockSvg();
		vi.spyOn(svg, 'cloneNode').mockImplementation(() => {
			throw new Error('clone failed');
		});
		await expect(exportChartAsSvg(svg, 'chart.svg')).resolves.toBeUndefined();
	});
});

// ---- exportPlotlyPng ----

describe('exportPlotlyPng', () => {
	let mockPlotly: { toImage: ReturnType<typeof vi.fn> };
	let clickSpy: ReturnType<typeof vi.fn>;
	let createdAnchor: HTMLAnchorElement | null;
	let mockCanvas: HTMLCanvasElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mockCtx: any;
	// Image mock that auto-fires onload asynchronously when src is set
	let mockImage: { onload: (() => void) | null; onerror: ((e: unknown) => void) | null; src: string };

	beforeEach(() => {
		mockPlotly = {
			toImage: vi.fn().mockResolvedValue('data:image/png;base64,plotlyimage')
		};

		clickSpy = vi.fn();
		createdAnchor = null;

		mockCtx = {
			fillRect: vi.fn(),
			fillText: vi.fn(),
			drawImage: vi.fn(),
			measureText: vi.fn().mockReturnValue({ width: 100 }),
			fillStyle: '',
			font: '',
			textAlign: '',
			textBaseline: ''
		};

		mockCanvas = {
			getContext: vi.fn().mockReturnValue(mockCtx),
			toDataURL: vi.fn().mockReturnValue('data:image/png;base64,composited'),
			width: 0,
			height: 0
		} as unknown as HTMLCanvasElement;

		// Auto-fires onload in next microtask when src is set
		mockImage = {
			onload: null,
			onerror: null,
			set src(_value: string) {
				Promise.resolve().then(() => {
					if (this.onload) this.onload();
				});
			}
		};

		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'a') {
				const a = Object.assign(document.createElementNS('http://www.w3.org/1999/xhtml', 'a'), {
					click: clickSpy
				}) as unknown as HTMLAnchorElement;
				createdAnchor = a;
				return a;
			}
			if (tag === 'canvas') return mockCanvas;
			if (tag === 'img') {
				return mockImage as unknown as HTMLImageElement;
			}
			return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
		});

		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
		vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls Plotly.toImage with format png, width 1200, height 800', async () => {
		const plotDiv = makeMockElement();
		const exportPromise = exportPlotlyPng(
			plotDiv,
			'chart.png',
			mockPlotly,
			'Test Chart',
			'Henry Baker . Hertie School'
		);

		await exportPromise;

		expect(mockPlotly.toImage).toHaveBeenCalledWith(
			plotDiv,
			expect.objectContaining({ format: 'png', width: 1200, height: 800 })
		);
	});

	it('draws on canvas and triggers download', async () => {
		const plotDiv = makeMockElement();
		const exportPromise = exportPlotlyPng(
			plotDiv,
			'plotly-chart.png',
			mockPlotly,
			'My Title',
			'Attribution text'
		);

		await exportPromise;

		expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
		expect(mockCtx.fillRect).toHaveBeenCalled();
		expect(mockCtx.drawImage).toHaveBeenCalled();
		expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
		expect(clickSpy).toHaveBeenCalled();
		expect(createdAnchor?.download).toBe('plotly-chart.png');
	});

	it('draws title text at top of canvas', async () => {
		const plotDiv = makeMockElement();
		const exportPromise = exportPlotlyPng(
			plotDiv,
			'chart.png',
			mockPlotly,
			'My Chart Title',
			'Attribution'
		);

		await exportPromise;

		// fillText should have been called at least twice (title + attribution)
		expect(mockCtx.fillText).toHaveBeenCalledWith(
			'My Chart Title',
			expect.any(Number),
			expect.any(Number)
		);
	});

	it('draws attribution text at bottom of canvas', async () => {
		const plotDiv = makeMockElement();
		const exportPromise = exportPlotlyPng(
			plotDiv,
			'chart.png',
			mockPlotly,
			'Title',
			'Henry Baker . Hertie School'
		);

		await exportPromise;

		expect(mockCtx.fillText).toHaveBeenCalledWith(
			'Henry Baker . Hertie School',
			expect.any(Number),
			expect.any(Number)
		);
	});

	it('handles errors gracefully without throwing', async () => {
		mockPlotly.toImage.mockRejectedValueOnce(new Error('Plotly error'));
		const plotDiv = makeMockElement();
		await expect(
			exportPlotlyPng(plotDiv, 'chart.png', mockPlotly, 'Title', 'Attribution')
		).resolves.toBeUndefined();
	});
});
