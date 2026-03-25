#!/usr/bin/env node
/**
 * Generate PCA projection from fixture-results.json.
 * Outputs platform/static/data/pca-projection.json
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

const PRECISION_MAP = { fp32: 32, bf16: 16, fp16: 16, int8: 8 };
const BACKEND_MAP = { pytorch: 0, vllm: 1, tensorrt: 2 };
const ATTN_MAP = { eager: 0, sdpa: 1, flash_attention_2: 2 };

const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf8'));

// Build feature matrix
const matrix = fixtures.map((r) => {
	const precision = r.effective_config.precision;
	const batchSize = r.effective_config.batch_size;
	const backend = r.backend;
	const attn = r.effective_config.attn_implementation;
	const loadIn8bit = r.effective_config.load_in_8bit;

	return [
		PRECISION_MAP[precision] ?? 16,
		Math.log2(batchSize),
		BACKEND_MAP[backend] ?? 0,
		ATTN_MAP[attn] ?? 0,
		loadIn8bit ? 1 : 0
	];
});

// Compute PCA with 3 components
const pca = new PCA(matrix, { nCompsPrincipal: 3, center: true, scale: true });
const projections = pca.predict(matrix, { nComponents: 3 });
const explainedVariance = pca.getExplainedVariance();

console.log(
	'Explained variance:',
	explainedVariance
		.slice(0, 3)
		.map((v) => (v * 100).toFixed(1) + '%')
		.join(', ')
);

// Build output
const points = fixtures.map((r, i) => ({
	experiment_id: r.experiment_id,
	pc1: projections.getRow(i)[0],
	pc2: projections.getRow(i)[1],
	pc3: projections.getRow(i)[2],
	energy: r.avg_energy_per_token_j,
	throughput: r.avg_tokens_per_second,
	backend: r.backend,
	precision: r.effective_config.precision,
	batch_size: r.effective_config.batch_size,
	attn: r.effective_config.attn_implementation
}));

const output = {
	explained_variance: explainedVariance.slice(0, 3),
	points
};

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Written ${points.length} points to ${outputPath}`);
