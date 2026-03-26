import type { ExperimentResult } from '../types.js';
import { getAllDimensions } from '../dimensions.js';

function csvEscape(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Discover all dimension keys present across a set of results,
 * in a stable order: backend, precision, then sorted remaining keys.
 */
function discoverColumns(results: ExperimentResult[]): string[] {
	const keys = new Set<string>();
	for (const r of results) {
		for (const k of Object.keys(getAllDimensions(r))) {
			keys.add(k);
		}
	}
	// Stable ordering: common fields first, then alphabetical
	const common = ['backend', 'precision'];
	const rest = [...keys].filter((k) => !common.includes(k)).sort();
	return [...common, ...rest];
}

export function toCSV(results: ExperimentResult[]): string {
	const dimCols = discoverColumns(results);
	const headers = [...dimCols, 'energy_j_per_token', 'throughput_tok_s'];

	const rows = results.map((r) => {
		const dims = getAllDimensions(r);
		const values = [
			...dimCols.map((k) => csvEscape(String(dims[k] ?? ''))),
			String(r.avg_energy_per_token_j),
			String(r.avg_tokens_per_second)
		];
		return values.join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}

export function toJSON(results: ExperimentResult[]): string {
	const simplified = results.map((r) => ({
		...getAllDimensions(r),
		energy_j_per_token: r.avg_energy_per_token_j,
		throughput_tok_s: r.avg_tokens_per_second
	}));
	return JSON.stringify(simplified, null, 2);
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
