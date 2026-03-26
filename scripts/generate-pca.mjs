#!/usr/bin/env node
/**
 * Generate per-backend PCA projections from fixture-results.json.
 * Outputs platform/static/data/pca-projection.json
 *
 * Each backend gets its own PCA since dimension sets are incommensurable
 * (e.g. pytorch has batch_size/attn_implementation while vllm has
 * enforce_eager/enable_chunked_prefill/max_num_seqs).
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ml-pca is installed in platform/node_modules; resolve explicitly
const require = createRequire(resolve(__dirname, '../platform/package.json'));
const { PCA } = require('ml-pca');

const fixturesPath = resolve(__dirname, '../platform/static/data/fixture-results.json');
const outputPath = resolve(__dirname, '../platform/static/data/pca-projection.json');

// Known ordinal mappings for string dimensions
const PRECISION_MAP = { fp32: 3, bf16: 2, fp16: 1, int8: 0 };
const STRING_ORDINALS = {
	attn_implementation: { eager: 0, sdpa: 1, flash_attention_2: 2 }
};

/**
 * Encode a dimension value as a number for PCA.
 */
function encodeValue(key, value) {
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (typeof value === 'number') return value;
	// String encoding: use known maps or fallback to alphabetical ordinal
	if (key === 'precision') return PRECISION_MAP[value] ?? 16;
	if (STRING_ORDINALS[key]) return STRING_ORDINALS[key][value] ?? 0;
	return 0;
}

const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf8'));

// Group by backend
const byBackend = {};
for (const r of fixtures) {
	const b = r.backend;
	if (!byBackend[b]) byBackend[b] = [];
	byBackend[b].push(r);
}

const output = { backends: {} };

for (const [backend, results] of Object.entries(byBackend)) {
	// Discover dimension keys for this backend
	const dimKeys = new Set();
	dimKeys.add('precision');
	for (const r of results) {
		for (const k of Object.keys(r.effective_config.dimensions)) {
			dimKeys.add(k);
		}
	}
	const keys = [...dimKeys].sort();

	console.log(`\n${backend}: ${results.length} experiments, dimensions: ${keys.join(', ')}`);

	if (results.length < 3) {
		console.log(`  Skipping PCA (need at least 3 experiments)`);
		continue;
	}

	// Build raw feature matrix
	const rawMatrix = results.map((r) => {
		return keys.map((k) => {
			if (k === 'precision') return encodeValue(k, r.effective_config.precision);
			const val = r.effective_config.dimensions[k];
			return val !== undefined ? encodeValue(k, val) : 0;
		});
	});

	// Drop columns with zero variance (constant across all experiments)
	const variantCols = [];
	for (let c = 0; c < keys.length; c++) {
		const vals = rawMatrix.map((row) => row[c]);
		const allSame = vals.every((v) => v === vals[0]);
		if (!allSame) variantCols.push(c);
	}

	if (variantCols.length < 2) {
		console.log(`  Skipping PCA (need at least 2 varying dimensions, got ${variantCols.length})`);
		continue;
	}

	const matrix = rawMatrix.map((row) => variantCols.map((c) => row[c]));
	const activeKeys = variantCols.map((c) => keys[c]);
	console.log(`  Active dimensions (non-constant): ${activeKeys.join(', ')}`);

	// Compute PCA with min(3, dimensions) components
	const nComps = Math.min(3, activeKeys.length);
	const pca = new PCA(matrix, { nCompsPrincipal: nComps, center: true, scale: true });
	const projections = pca.predict(matrix, { nComponents: nComps });
	const explainedVariance = pca.getExplainedVariance();

	console.log(
		'  Explained variance:',
		explainedVariance
			.slice(0, nComps)
			.map((v) => (v * 100).toFixed(1) + '%')
			.join(', ')
	);

	// Build points
	const points = results.map((r, i) => {
		const row = projections.getRow(i);
		return {
			experiment_id: r.experiment_id,
			pc1: row[0] ?? 0,
			pc2: row[1] ?? 0,
			pc3: row[2] ?? 0,
			energy: r.avg_energy_per_token_j,
			throughput: r.avg_tokens_per_second,
			backend: r.backend,
			dimensions: {
				precision: r.effective_config.precision,
				...r.effective_config.dimensions
			}
		};
	});

	output.backends[backend] = {
		explained_variance: explainedVariance.slice(0, nComps),
		points
	};

	console.log(`  ${points.length} points projected`);
}

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\nWritten to ${outputPath}`);
