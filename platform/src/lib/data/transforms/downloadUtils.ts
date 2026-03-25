import type { ExperimentResult } from '../types.js';

export function toCSV(results: ExperimentResult[]): string {
	void results;
	throw new Error('not implemented');
}

export function toJSON(results: ExperimentResult[]): string {
	void results;
	throw new Error('not implemented');
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
