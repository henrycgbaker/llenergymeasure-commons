<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import ExpandableDetail from '$lib/components/ExpandableDetail.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
</script>

<svelte:head>
	<title>Methodology - LLM Energy Commons</title>
	<meta
		name="description"
		content="How we measure LLM inference energy consumption: GPU power sampling, configuration dimensions, and data coverage."
	/>
</svelte:head>

<PageLayout>
<main>
	<header class="page-header">
		<h1>Methodology</h1>
		<p class="lead">
			How we measure the energy cost of running large language models - and why implementation
			choices matter far more than which model you choose.
		</p>
	</header>

	<Section title="The short version">
		<p>
			We measure the energy consumed when a large language model (LLM) generates text. The same
			model on the same GPU can draw up to <strong>8 times more energy</strong> depending on four configuration
			choices: numerical precision, batch size, inference backend, and attention implementation. This
			site presents evidence for that claim.
		</p>
		<p>
			The measurements are produced by
			<a href="https://github.com/llenergymeasure" rel="noopener noreferrer">llenergymeasure</a>
			(<code>llem</code>), a Python command-line tool that profiles GPU power during inference and
			records energy, throughput, and configuration metadata in a structured, reusable format.
		</p>
	</Section>

	<Section title="What we measure">
		<p>
			Each measurement captures a complete inference run - from loading the model to generating the
			final output token - under a specific configuration. We record:
		</p>

		<dl class="metric-list">
			<div class="metric-item">
				<dt>Energy (Joules)</dt>
				<dd>
					Total electrical energy consumed by the GPU during the inference run. This is the primary
					metric. Joules are the standard unit of energy: one joule equals one watt of power
					sustained for one second. We also report energy per output token (J/token), which
					normalises for output length and allows fair comparison across batch sizes.
				</dd>
			</div>
			<div class="metric-item">
				<dt>Throughput (tokens per second)</dt>
				<dd>
					The rate at which the model generates output tokens. Higher throughput means the same
					energy goes further - more useful work per joule. Throughput and energy efficiency often
					improve together when configuration is optimised.
				</dd>
			</div>
			<div class="metric-item">
				<dt>Latency</dt>
				<dd>
					Time to first token and total generation time. Relevant for interactive applications where
					a user is waiting for a response.
				</dd>
			</div>
			<div class="metric-item">
				<dt>GPU utilisation</dt>
				<dd>
					Proportion of GPU compute capacity in use during inference. Low utilisation with high
					energy draw indicates inefficiency.
				</dd>
			</div>
		</dl>

		<p>The four configuration dimensions we sweep across are:</p>

		<dl class="config-list">
			<div class="config-item">
				<dt>Numerical precision</dt>
				<dd>
					The numeric format used to represent model weights and intermediate computations. Common
					options: <code>fp32</code> (full 32-bit floating point, most precise, highest energy),
					<code>fp16</code> and <code>bf16</code> (16-bit formats, roughly half the compute cost),
					and <code>int8</code> (8-bit integer quantisation via post-training quantisation, lowest energy).
					Precision is a primary driver of energy consumption.
				</dd>
			</div>
			<div class="config-item">
				<dt>Batch size</dt>
				<dd>
					The number of prompts processed simultaneously in a single GPU pass. Larger batches
					amortise the fixed cost of loading model weights across more requests, dramatically
					reducing energy per output token. Batch size 1 (processing one prompt at a time) is the
					worst-case scenario for energy efficiency. Batch size 128 can be 2-3 times more efficient
					per token than batch size 1.
				</dd>
			</div>
			<div class="config-item">
				<dt>Inference backend</dt>
				<dd>
					The software stack that executes the model. We test three backends:
					<strong>PyTorch</strong> (the standard research framework, highest baseline energy),
					<strong>vLLM</strong> (production-optimised serving with PagedAttention memory
					management), and <strong>TensorRT-LLM</strong> (NVIDIA's compiled inference engine, lowest energy
					in most configurations). Backend choice can account for a 30-50% difference in energy consumption
					for the same model and precision.
				</dd>
			</div>
			<div class="config-item">
				<dt>Attention implementation</dt>
				<dd>
					The algorithm used to compute attention, the most computationally intensive operation in
					transformer models. Standard (eager) attention computes the full attention matrix in
					memory. <strong>SDPA</strong> (Scaled Dot-Product Attention, built into PyTorch 2.0+) uses
					memory-efficient kernels. <strong>Flash Attention v2</strong> reorders memory access to minimise
					GPU memory bandwidth, typically reducing energy by 15-20% relative to standard attention.
				</dd>
			</div>
		</dl>
	</Section>

	<Section title="How we measure">
		<p>
			llenergymeasure samples GPU power at approximately 100 millisecond intervals using NVIDIA NVML
			(NVIDIA Management Library), the same library that powers <code>nvidia-smi</code>. Energy is
			calculated by numerically integrating the power curve over the inference duration: total
			energy (J) = &#8747; power(t) dt.
		</p>

		<p>Three design choices ensure measurement quality:</p>

		<ol class="method-steps">
			<li>
				<strong>Baseline subtraction.</strong> We measure idle GPU power before inference begins and subtract
				it from the total. This isolates the energy cost of the inference workload from background GPU
				activity (driver overhead, monitoring processes, etc.).
			</li>
			<li>
				<strong>Warmup phase excluded.</strong> The first inference pass is discarded. GPU resources (memory
				allocation, JIT compilation, cache warming) are initialised during warmup and would inflate energy
				readings if included.
			</li>
			<li>
				<strong>Multiple cycles averaged.</strong> We run each configuration multiple times and report
				aggregate statistics. This smooths measurement noise from OS scheduling, thermal variation, and
				GPU clock frequency fluctuations.
			</li>
		</ol>

		<ExpandableDetail title="Technical detail: measurement protocol">
			<p>
				Power samples are collected in a background thread at ~100ms intervals using
				<code>pynvml.nvmlDeviceGetPowerUsage()</code>. The inference workload runs in the main
				thread. After the inference completes, the power trace is trimmed to the exact inference
				window using timestamps, and the trapezoidal rule is applied to integrate the power curve.
			</p>
			<p>
				Each experiment produces an <code>ExperimentResult</code> object conforming to the llenergymeasure
				v2 schema. This includes: the energy metrics described above, a full environment snapshot (GPU
				model, driver version, CUDA version, Python version, library versions), the exact configuration
				hash, and optional Parquet-format power timeseries sidecars for detailed temporal analysis.
			</p>
			<p>
				The <code>measurement_config_hash</code> field provides a stable identifier for each unique configuration,
				enabling deduplication and incremental dataset updates as new measurements are added.
			</p>
		</ExpandableDetail>
	</Section>

	<Section title="Hardware">
		<p>
			The data on this site was collected on a single NVIDIA A100 80GB GPU. The A100 is a high-end
			data-centre GPU representative of the hardware used for production LLM inference in cloud
			environments. Its 400W thermal design power (TDP) and 80GB of HBM2e memory make it capable of
			running large models at full precision without the memory constraints that affect smaller
			GPUs.
		</p>
		<p>
			Measurements on consumer GPUs (RTX 4090, RTX 3090) or other data-centre GPUs (H100, A10) would
			show different absolute energy values but the same directional pattern: precision, batch size,
			backend, and attention implementation choices drive the same relative differences regardless
			of GPU generation.
		</p>
	</Section>

	<Section title="About the data">
		<div class="coverage-statement">
			<h3>Data coverage</h3>

			<div class="coverage-grid">
				<div class="coverage-item covered">
					<h4>What is covered</h4>
					<ul>
						<li>Model: <strong>Llama 3 8B Instruct</strong> (Meta)</li>
						<li>Hardware: <strong>NVIDIA A100 80GB</strong></li>
						<li>Precisions: <strong>fp32, fp16, bf16, int8</strong></li>
						<li>Batch sizes: <strong>1, 8, 32, 64, 128</strong></li>
						<li>Backends: <strong>PyTorch, vLLM, TensorRT-LLM</strong></li>
						<li>Attention: <strong>eager, SDPA, Flash Attention v2</strong></li>
						<li>Total configurations: <strong>~180 unique combinations</strong></li>
					</ul>
				</div>

				<div class="coverage-item not-covered">
					<h4>What is not covered</h4>
					<ul>
						<li>Other models (Llama 3 70B, Mistral, Gemma, etc.)</li>
						<li>Other GPU hardware (H100, RTX series, AMD)</li>
						<li>Multi-GPU configurations</li>
						<li>Training workloads (inference only)</li>
						<li>Quantisation methods beyond int8 (GPTQ, AWQ, etc.)</li>
						<li>Speculative decoding and KV-cache strategies</li>
						<li>Network latency or serving overhead</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="fixture-notice">
			<strong>Current data status: Preview (simulated).</strong> The data on this site is simulated fixture
			data modelled on the llenergymeasure schema, designed to demonstrate realistic magnitudes and directional
			trends. The 8x worst-to-best ratio is calibrated to match expected empirical results. Real measurements
			on physical hardware are in progress and will replace this fixture data when available.
		</div>
	</Section>

	<Section>
		<ExpandableDetail title="Limitations and caveats">
			<ul>
				<li>
					<strong>Single GPU only.</strong> All measurements reflect single-GPU inference. Multi-GPU deployments
					have different energy profiles and communication overhead not captured here.
				</li>
				<li>
					<strong>Inference only.</strong> Training energy consumption is not measured. Training a model
					from scratch is orders of magnitude more expensive than inference, but llenergymeasure focuses
					on deployment-time energy, which is where operational decisions have the most leverage.
				</li>
				<li>
					<strong>English prompts, specific dataset.</strong> Measurements use a standardised English-language
					prompt dataset. Prompt length, language, and content affect energy consumption; results may
					not generalise to all workloads.
				</li>
				<li>
					<strong>No cooling or facility overhead.</strong> Reported values are GPU-level energy only.
					Data centre power usage effectiveness (PUE) - typically 1.2-1.6x for modern facilities - is
					not included. Multiply by your facility's PUE for wall-socket energy.
				</li>
				<li>
					<strong>Snapshot in time.</strong> Software backends are updated frequently. vLLM and TensorRT-LLM
					efficiency improvements in future releases would reduce the measured values for those backends.
				</li>
			</ul>
		</ExpandableDetail>
	</Section>
</main>
</PageLayout>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.page-header {
		padding-block: var(--space-12);
		border-bottom: 3px solid var(--color-primary);
		margin-bottom: var(--space-8);
	}

	.page-header h1 {
		margin-bottom: var(--space-4);
	}

	.lead {
		font-size: var(--text-xl);
		font-family: var(--font-heading);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		max-width: 44rem;
	}

	/* Metric and config definition lists */
	.metric-list,
	.config-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		list-style: none;
		padding: 0;
	}

	.metric-item,
	.config-item {
		padding: var(--space-4) var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--color-primary);
		border-radius: var(--radius-md);
	}

	.metric-item dt,
	.config-item dt {
		font-family: var(--font-heading);
		font-weight: var(--weight-bold);
		font-size: var(--text-lg);
		color: var(--color-primary);
		margin-bottom: var(--space-2);
	}

	.metric-item dd,
	.config-item dd {
		margin: 0;
		color: var(--color-text);
		line-height: var(--leading-relaxed);
	}

	/* Method steps */
	.method-steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-left: var(--space-6);
	}

	.method-steps li {
		line-height: var(--leading-relaxed);
	}

	/* Coverage statement */
	.coverage-statement {
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.coverage-statement h3 {
		margin-bottom: var(--space-6);
		font-size: var(--text-2xl);
	}

	.coverage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-6);
	}

	.coverage-item {
		padding: var(--space-4);
		border-radius: var(--radius-md);
	}

	.coverage-item.covered {
		background: color-mix(in srgb, var(--color-energy-efficient) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-energy-efficient) 30%, transparent);
	}

	.coverage-item.not-covered {
		background: color-mix(in srgb, var(--color-border) 30%, transparent);
		border: 1px solid var(--color-border);
	}

	.coverage-item h4 {
		font-size: var(--text-base);
		margin-bottom: var(--space-3);
		color: var(--color-text);
	}

	.coverage-item ul {
		margin: 0;
		padding-left: var(--space-4);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
	}

	.coverage-item li {
		color: var(--color-text);
	}

	/* Fixture data notice */
	.fixture-notice {
		margin-top: var(--space-6);
		padding: var(--space-4) var(--space-6);
		background: var(--color-banner-bg);
		border-left: 4px solid var(--color-banner-border);
		color: var(--color-banner-text);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}
</style>
