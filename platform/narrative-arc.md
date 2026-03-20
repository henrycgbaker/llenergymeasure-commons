# Narrative Arc: LLM Energy Commons

**Status:** Structural specification (Phase 1 deliverable)
**Prose status:** Deferred - copy will be drafted when real measurement data is available
**Audience:** Policy advisers drafting AI regulation or procurement guidance

---

## Overview

The site tells a single story in five beats. Each beat builds on the previous, moving the reader
from surprise (the headline number) through understanding (what drives it) to exploration (the
full dataset) to depth (the temporal dimension) to action (what to do about it). The emotional
arc is: *disbelief → curiosity → comprehension → urgency → agency*.

The story has one core claim: **same model, same GPU, 8x energy difference from configuration
alone**. Every beat serves this claim.

---

## Beat 1: Hook

**Intent:** Grab attention with a single surprising number. Do not explain. Let the number speak.

**Rhetorical mode:** Evidence-first. The number is the claim. No framing, no hedging, no context
yet. Policy readers are trained to distrust advocacy - leading with unadorned data establishes
credibility.

**Emotional arc:** Disbelief → intrigue. The reader should think "that can't be right" - which
creates the pull to read further.

**What the reader understands after this beat:**
- The magnitude of the efficiency gap (8x)
- This is about the same model on the same hardware - not about model choice
- The story is about configuration, not capability

**Component slot:** Large animated number reveal
- Full-viewport section with the number "8x" as the centrepiece
- Secondary line: "Same model. Same GPU." (appears after a short delay)
- Tertiary line: "Different configuration." (appears last)
- Subtle animation: number counts up from 1x to 8x over ~1.5 seconds
- Background: near-black, white text (visual contrast as emphasis)
- No charts, no controls - just the number

**Data requirements from fixture-results.json:**
- The `avg_energy_per_token_j` of the worst configuration (fp32, batch=1, PyTorch, eager)
- The `avg_energy_per_token_j` of the best configuration (bf16 or int8, batch=128, TensorRT, flash_v2)
- The ratio between them (should be ~8x by fixture design)
- The exact values need not be shown in this beat - just the ratio

---

## Beat 2: Reveal

**Intent:** Show what drives the 8x difference. Make the configuration landscape concrete.
Introduce the real-world equivalence to make the abstract energy number tangible.

**Rhetorical mode:** Show, don't tell. The heatmap makes the claim visual without requiring
the reader to process numbers. The equivalence ("same as charging N smartphones") grounds the
abstract in the familiar.

**Emotional arc:** Curiosity → comprehension. The reader now understands the shape of the
problem - some regions of the configuration landscape are expensive, others are cheap.

**What the reader understands after this beat:**
- Which configuration dimensions matter most (precision and batch size dominate)
- The shape of the efficiency landscape - it is not random, it has structure
- A concrete sense of the absolute energy scale (via equivalence)
- That this has real operational implications

**Component slot:** 2D heatmap + equivalence callout
- 2D topographic/heatmap: one axis = precision (fp32, fp16, bf16, int8), other axis = batch size
  (1, 8, 32, 64, 128); colour = avg_energy_per_token_j; the diverging energy palette
  (--color-energy-wasteful to --color-energy-efficient)
- Fixed to a single backend + attention combination initially (e.g. PyTorch + SDPA) to keep the
  reveal focused
- Contour lines at meaningful thresholds (2x, 4x, 8x relative to best-case)
- Equivalence callout card: "Running 1,000 queries at worst-case configuration uses as much energy
  as charging [N] smartphones" - where N is derived from the worst-case total_energy_j figure

**Data requirements from fixture-results.json:**
- `avg_energy_per_token_j` for all (precision × batch_size) combinations at a fixed backend + attention
- The worst-case total energy for a representative 1,000-query batch (to compute the equivalence)
- The best-case for comparison (to set the colour scale anchor)

---

## Beat 3: Exploration

**Intent:** Let the reader explore the full configuration landscape. Shift from passive reading
to active investigation. Every reader has a different configuration question; this beat answers
all of them.

**Rhetorical mode:** Interactive evidence. The reader is the investigator. The chart responds
to their questions. This beat is the site's primary research value.

**Emotional arc:** Comprehension → ownership. The reader now has their own data point - they
have explored the configuration relevant to their context.

**What the reader understands after this beat:**
- The full dimensionality of the configuration landscape (all 4 dimensions, all ~180 configurations)
- The relative contribution of each configuration dimension
- Where their specific use-case sits in the landscape (if they explore)
- That the 8x headline is real - they have seen it in the data themselves

**Component slot:** Interactive heatmap with filters
- Same 2D heatmap as Beat 2, but now with filter controls:
  - Backend selector (PyTorch / vLLM / TensorRT-LLM)
  - Attention selector (eager / SDPA / Flash Attention v2)
  - Metric toggle (energy per token / total throughput / latency)
- Hover tooltip: shows exact values for each cell, plus the ratio vs. best configuration
- Click to select: clicking a cell highlights the row in a small data table beneath
- "Best" and "Worst" configurations always highlighted with a border/label
- Zoom: ability to zoom into a region of the heatmap for dense configurations

**Data requirements from fixture-results.json:**
- Full dataset: all records with `avg_energy_per_token_j`, `avg_tokens_per_second`,
  `effective_config.precision`, `effective_config.batch_size`, `effective_config.backend`,
  `effective_config.attn_implementation`
- Pre-computed min/max per metric for colour scale normalisation
- Backend and attention enumeration for filter controls

---

## Beat 4: Depth

**Intent:** Show the temporal dimension - how power draw varies over time during inference.
This is the visceral, cinematic beat. The animated power curves are physically intuitive in
a way that summary statistics are not.

**Rhetorical mode:** Cinematic evidence. The reader watches inference happen. Side-by-side
comparison makes the difference between configurations visible as motion, not numbers.

**Emotional arc:** Comprehension → urgency. Seeing the power curves side by side creates a
physical sense of waste - the fp32 curve is a jagged plateau where the fp16 curve is a lower
smoother trace. The difference is not abstract.

**What the reader understands after this beat:**
- That the efficiency difference is physical - you can see it in the power draw over time
- That high-precision models draw more power throughout the entire inference, not just at peaks
- That this is not a marginal difference - the gap is large enough to see clearly in the chart

**Component slot:** Animated side-by-side power timeseries
- Two panels, side by side: "Worst case" (fp32, batch=1, PyTorch, eager) vs "Best case"
  (bf16, batch=128, TensorRT, Flash Attention v2)
- X-axis: time (seconds); Y-axis: GPU power draw (watts)
- Animation: the power curves draw from left to right in real time (or at a compressed
  timescale if inference takes >30 seconds in the fixture data)
- Play/pause/scrub controls
- Area under the curve shaded in the energy palette colours
- Running energy counter below each panel (accumulates as animation plays)
- At animation end: a callout shows the total energy ratio

**Data requirements from fixture-results.json (or Parquet sidecar):**
- Power timeseries (watts, timestamped) for the worst-case and best-case configurations
  - Note: if llenergymeasure produces Parquet sidecar files, use those; if not, the timeseries
    can be synthesised from the `total_energy_j` and `total_inference_time_sec` fields using
    a realistic power curve shape (ramp up, plateau, ramp down)
- `total_energy_j` and `total_inference_time_sec` for both configurations (for the running counter)
- GPU power at baseline (idle) for reference line

---

## Beat 5: Action

**Intent:** Translate the findings into concrete, actionable guidance for policy audiences.
Move from "this is true" to "here is what to do about it". Ensure the reader leaves with
specific levers they can pull.

**Rhetorical mode:** Prescriptive. The site earns the right to prescribe by having shown the
evidence in the first four beats. Recommendations are grounded in the data, not asserted.

**Emotional arc:** Urgency → agency. The reader has seen the problem; now they have tools.
The three-lever structure (Regulation, Deployment, Procurement) maps directly to different
reader roles - a regulator, an IT director, a procurement officer each find their specific
action.

**What the reader understands after this beat:**
- Three concrete levers they can pull to improve AI energy efficiency
- That these levers are available now - no new technology is required
- That the 8x gap is not inevitable - it is a consequence of default choices that can be changed

**Component slot:** Three policy lever sections

### Lever 1: Regulation
- **Heading:** "Mandate efficiency benchmarking in AI procurement standards"
- **Core claim:** Current AI energy reporting focuses on model capability, not deployment
  efficiency. The same model can have an 8x energy cost difference based on configuration
  alone - yet no current standard requires reporting of configuration alongside energy figures.
- **Specific recommendation:** Require that AI energy disclosures include: the inference backend,
  numerical precision, and batch size used in production. Without this, reported energy figures
  are not comparable.
- **Supporting data:** Show the range of energy values for the same model across configurations
  (a simple range chart or the 8x headline)
- **Data requirement:** min/max `avg_energy_per_token_j` across all configurations

### Lever 2: Deployment
- **Heading:** "Use production-optimised inference backends by default"
- **Core claim:** Many organisations deploy LLMs using research-grade software (PyTorch defaults)
  intended for model development, not production serving. Switching to a production-optimised
  backend (vLLM or TensorRT-LLM) reduces energy consumption by 20-40% with no impact on model
  capability.
- **Specific recommendation:** Audit inference deployments. If running vanilla PyTorch, migrate
  to vLLM or TensorRT-LLM. Enable Flash Attention where supported. Use bf16 precision unless
  the application requires fp32 accuracy.
- **Supporting data:** Bar chart: energy per token by backend, fixed precision and batch size
- **Data requirement:** `avg_energy_per_token_j` grouped by `backend` at fixed precision + attention

### Lever 3: Procurement
- **Heading:** "Include efficiency configuration requirements in AI service contracts"
- **Core claim:** When procuring AI services, organisations have no visibility into the energy
  cost of their usage. A service operating at fp32 precision with batch=1 serving costs 8x more
  energy per query than the same model at optimised settings - and the buyer has no way to know.
- **Specific recommendation:** Add efficiency schedule to AI service contracts specifying minimum
  precision settings, minimum batch size commitments, and required backend. This is analogous
  to procurement standards for building energy ratings.
- **Supporting data:** The 8x ratio framed as a cost comparison ("8x energy = 8x GPU operating
  cost at the margin")
- **Data requirement:** The worst-case / best-case comparison values from Beat 1

---

## Data contract summary

The following fields from `fixture-results.json` are required for all five beats:

| Field | Beats | Notes |
|-------|-------|-------|
| `avg_energy_per_token_j` | 1, 2, 3, 4, 5 | Primary metric; must be present for all records |
| `avg_tokens_per_second` | 3 | Secondary metric for exploration toggle |
| `total_energy_j` | 2, 4 | For equivalence callout and running counter |
| `total_inference_time_sec` | 4 | For animation timescale |
| `effective_config.precision` | 1, 2, 3, 5 | Configuration dimension |
| `effective_config.batch_size` | 2, 3, 5 | Configuration dimension |
| `effective_config.backend` | 3, 5 | Configuration dimension |
| `effective_config.attn_implementation` | 3 | Configuration dimension |
| Power timeseries (Parquet sidecar or synthetic) | 4 | If unavailable, synthesise from summary fields |

---

## Implementation notes for Phase 2

- Beats 1 and 2 are static/semi-static: fixed data, minimal interactivity
- Beat 3 is the interactive core: requires full dataset loaded in the browser
- Beat 4 requires either real timeseries data or a synthesised power curve
- Beat 5 is static editorial content with simple supporting charts
- The scroll-jacking / scroll-triggered reveal is optional; the beats can also be
  implemented as conventional sections with scroll-triggered animation entry
- Consider a "skip to explorer" link from Beat 1 for repeat visitors

---

*Document status: Structural specification for Phase 2 planning*
*Created: 2026-03-20*
*Phase: 01-foundation*
