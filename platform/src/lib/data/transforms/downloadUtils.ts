import type { ExperimentResult } from '../types.js';

const CSV_HEADERS = [
	'backend',
	'precision',
	'batch_size',
	'attn_implementation',
	'load_in_8bit',
	'energy_j_per_token',
	'throughput_tok_s'
];

function csvEscape(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function toCSV(results: ExperimentResult[]): string {
	const rows = results.map((r) => {
		const values = [
			csvEscape(r.backend),
			csvEscape(r.effective_config.precision),
			String(r.effective_config.batch_size),
			csvEscape(r.effective_config.attn_implementation),
			r.effective_config.load_in_8bit ? 'true' : 'false',
			String(r.avg_energy_per_token_j),
			String(r.avg_tokens_per_second)
		];
		return values.join(',');
	});
	return [CSV_HEADERS.join(','), ...rows].join('\n');
}

export function toJSON(results: ExperimentResult[]): string {
	const simplified = results.map((r) => ({
		backend: r.backend,
		precision: r.effective_config.precision,
		batch_size: r.effective_config.batch_size,
		attn_implementation: r.effective_config.attn_implementation,
		load_in_8bit: r.effective_config.load_in_8bit,
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
