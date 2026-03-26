---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-distribution-polish plan 01 (chart meta, citations, export utilities)
last_updated: "2026-03-26T00:51:49.663Z"
last_activity: 2026-03-20 - Completed plan 01-02 (SvelteKit site scaffold)
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 14
  completed_plans: 12
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Demonstrate convincingly to a policy audience that implementation factors - not
model selection - are the primary lever for AI energy efficiency.
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 2 of TBD in current phase
Status: In progress
Last activity: 2026-03-20 - Completed plan 01-02 (SvelteKit site scaffold)

Progress: [██░░░░░░░░] ~20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 9 min
- Total execution time: 18 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 18 min | 9 min |

**Recent Trend:**
- Last 5 plans: 18 min
- Trend: baseline

*Updated after each plan completion*
| Phase 02-scroll-narrative P01 | 3 | 2 tasks | 9 files |
| Phase 02-scroll-narrative P02 | 9 | 2 tasks | 9 files |
| Phase 02-scroll-narrative P03 | 7min | 2 tasks | 6 files |
| Phase 02-scroll-narrative P04 | 7 | 2 tasks | 4 files |
| Phase 02-scroll-narrative P05 | 12 | 1 tasks | 11 files |
| Phase 03-explorer-advanced-visualisations P01 | 4 | 2 tasks | 11 files |
| Phase 03-explorer-advanced-visualisations P02 | 5 | 2 tasks | 5 files |
| Phase 03-explorer-advanced-visualisations P03 | 9 | 2 tasks | 5 files |
| Phase 04-distribution-polish P01 | 6 | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: SvelteKit + adapter-static + D3 + Plotly + GSAP + DuckDB-WASM; deploy to GitHub Pages
- Data: Fixture data designed as editorial content - agree 5 headline numbers before writing records
- Architecture: Build-time data transforms only; chart components receive pre-shaped typed props
- Fixture energy factors: RESEARCH.md skeleton factors produce 19x ratio; recalibrated to hit 8x target
- int8 precision: modelled as load_in_8bit=True with compute dtype bf16 (matches llenergymeasure bitsandbytes pattern)
- Svelte 5 runes syntax ($props(), {@render children()}) used throughout; do not mix with legacy export let
- Energy colour palette: ColorBrewer RdBu diverging scale (#2166ac efficient, #d6604d wasteful) - colourblind-safe
- Static prerendering set at root layout level so all child routes inherit it
- [Phase 02-scroll-narrative]: Deterministic noise for synthesisePowerCurve: Math.sin(i * 0.3) avoids random seed issues in tests
- [Phase 02-scroll-narrative]: ratioVsBest computed within backend+attn slice so heatmap displays one slice at a time correctly
- [Phase 02-scroll-narrative]: HeatmapCell sorts descending by energy so scroll reveal starts with worst config first
- [Phase 02-scroll-narrative]: GSAP dynamic import in onMount (SSR-safe); ScrollTrigger.matchMedia for pointer vs touch; Beat 2 scroll progress via native DOM events; root layout decoupled from PageLayout for full-viewport Beat 1; ContourLines via row-boundary analysis (grid too small for d3-contour)
- [Phase 02-scroll-narrative]: d3.zoom applied to SVG element in $effect; inner <g> receives transform so axes remain stable during pan/zoom
- [Phase 02-scroll-narrative]: Filter/metric changes use zoomResetTrigger counter to signal ConfigHeatmap to reset zoom identity
- [Phase 02-scroll-narrative]: ESLint varsIgnorePattern added to Svelte rule block to handle TypeScript interface callback parameter name false positives
- [Phase 02-scroll-narrative]: PowerTimeseries uses native scroll getBoundingClientRect tracking (not GSAP) matching Beat 2 pattern
- [Phase 02-scroll-narrative]: Both power curves normalised to 60 s time axis for fair visual comparison regardless of real inference duration
- [Phase 02-scroll-narrative]: Beat 3 two-section approach: short NarrativeSection intro + separate unpinned section avoids sticky toggle jitter
- [Phase 02-scroll-narrative]: SvelteSet imported from svelte/reactivity (not svelte) for reactive deduplication
- [Phase 02-scroll-narrative]: Beat 4 equivalences use avg_energy_per_token_j (static per config, not scroll-driven) — consistent with heatmap tooltip pattern
- [Phase 02-scroll-narrative]: Dark-to-light transition uses a gradient div with negative margin-top to overlap Beat 1 boundary
- [Phase 03-explorer-advanced-visualisations]: ml-pca in platform/ resolved via createRequire from root scripts/
- [Phase 03-explorer-advanced-visualisations]: PCA feature matrix: log2(batch_size) + ordinal encodings; 3 components explain 66.7% variance
- [Phase 03-explorer-advanced-visualisations]: Surface grid fills missing cells with global mean of non-missing cells (neutral interpolation)
- [Phase 03-explorer-advanced-visualisations]: Full dataset footer download uses inline handlers (not DownloadButton) for distinct styling
- [Phase 03-explorer-advanced-visualisations]: Explorer tab scaffold: page holds filter $state, passes filteredResults as allResults to chart components
- [Phase 03-explorer-advanced-visualisations]: SvelteMap instead of native Map for per-axis D3 scale storage (svelte/prefer-svelte-reactivity rule)
- [Phase 03-explorer-advanced-visualisations]: D3 brush/drag set up in onMount not effect: prevents infinite filter-redraw loop (Research pitfall 4)
- [Phase 03-explorer-advanced-visualisations]: plotDiv declared as $state<HTMLDivElement | undefined> in Svelte 5 for reactive bind:this bindings
- [Phase 03-explorer-advanced-visualisations]: Plotly typed as unknown with getPlotly() cast helper — no @types package, avoid eslint any in Svelte files
- [Phase 03-explorer-advanced-visualisations]: Tab switching uses {#if} not display:none so Plotly.purge fires on destroy — prevents WebGL context exhaustion
- [Phase 04-distribution-polish]: CHART_SLUGS is a const tuple (not enum) so TypeScript infers ChartSlug union type automatically
- [Phase 04-distribution-polish]: exportPlotlyPng canvas layout: 60px title + 800px Plotly + 40px attribution = 900px total at 1200px width
- [Phase 04-distribution-polish]: VITE_DATASET_HASH ?? 'dev' fallback makes citations work in all environments without env var setup

### Pending Todos

None yet.

### Blockers/Concerns

- Verify GSAP licence compatibility with Hertie School open-source publishing requirements before
  finalising stack (research flag from SUMMARY.md)
- Confirm llenergymeasure Parquet timeseries sidecar output format before building PowerTimeseries
- DuckDB-WASM: pin to stable 1.29.x - verify exact tag at github.com/duckdb/duckdb-wasm/releases
  before Phase 3 begins

## Session Continuity

Last session: 2026-03-26T00:51:49.658Z
Stopped at: Completed 04-distribution-polish plan 01 (chart meta, citations, export utilities)
Resume file: None
